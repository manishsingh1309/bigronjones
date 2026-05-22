import http from "http";
import fs from "node:fs";
import path from "node:path";
import { parse } from "url";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const PORT = Number(process.env.PORT || 8081);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const API_ROOT = path.join(__dirname, "handlers");
// Admin handlers live outside the backend in /admin/backend/handlers/*.
// The dev file router treats /api/admin/* URLs as a special case so the
// "admin/" prefix in the URL maps to the admin handler folder (without
// the prefix). Vercel uses backend/handlers/manifest.ts and does not
// need this — manifest already imports admin from the new location.
const ADMIN_HANDLERS_ROOT = path.resolve(
  __dirname,
  "..",
  "admin",
  "backend",
  "handlers",
);

const loadEnvFile = () => {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const env = fs.readFileSync(envPath, "utf8");
  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadEnvFile();

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: { autoRefreshToken: false, persistSession: false },
        },
      )
    : null;

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });

const sendJson = (res, status, payload) => {
  res.writeHead(status);
  res.end(JSON.stringify(payload));
};

// ──────────────────────────────────────────────────────────────────────────
// File-based router for /api/* — mirrors how Vercel routes backend/api/*.ts
// in production. In dev we resolve the URL to a handler file, dynamically
// import it (tsx transpiles TS on the fly), and call its default export with
// a Web Request, then pipe the Web Response back to Node.
// ──────────────────────────────────────────────────────────────────────────
const readRawBody = (req) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const resolveHandlerFile = (apiPath: string): string | null => {
  // Strip query, normalize, prevent path traversal
  const clean = apiPath.replace(/\?.*$/, "").replace(/\/+$/, "");
  if (clean.includes("..")) return null;

  // /api/admin/* → admin/backend/handlers/* (strip the "admin/" prefix).
  if (clean.startsWith("admin/")) {
    const adminSub = clean.slice("admin/".length);
    const adminCandidates = [
      path.join(ADMIN_HANDLERS_ROOT, `${adminSub}.ts`),
      path.join(ADMIN_HANDLERS_ROOT, adminSub, "index.ts"),
    ];
    for (const candidate of adminCandidates) {
      if (
        candidate.startsWith(ADMIN_HANDLERS_ROOT) &&
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile()
      ) {
        return candidate;
      }
    }
  }

  const candidates = [
    path.join(API_ROOT, `${clean}.ts`),
    path.join(API_ROOT, clean, "index.ts"),
  ];
  for (const candidate of candidates) {
    if (
      candidate.startsWith(API_ROOT) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      return candidate;
    }
  }
  return null;
};

const nodeReqToWebRequest = (req, rawBody: Buffer): Request => {
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) || "http";
  const host = (req.headers.host as string | undefined) || `localhost:${PORT}`;
  const url = `${proto}://${host}${req.url}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, String(value));
  }
  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD" && rawBody.length > 0) {
    init.body = rawBody;
    // @ts-expect-error — Node 18+ requires this when body is a stream/buffer
    init.duplex = "half";
    try {
      // Attach raw body as a header (utf8) for handler diagnostics when
      // parsing fails — useful in dev only.
      const rawText = rawBody.toString("utf8");
      if (rawText) headers.set("x-raw-body", rawText);
    } catch {
      // ignore
    }
  }
  return new Request(url, init);
};

const pipeWebResponse = async (webRes: Response, nodeRes) => {
  const buf = Buffer.from(await webRes.arrayBuffer());
  // We've already set CORS + content-type; let the handler override if it set its own
  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") return;
    nodeRes.setHeader(key, value);
  });
  nodeRes.statusCode = webRes.status;
  nodeRes.end(buf);
};

const dispatchToHandler = async (req, res, pathname: string) => {
  // strip leading "/api/"
  const apiPath = pathname.replace(/^\/api\//, "");
  const handlerFile = resolveHandlerFile(apiPath);
  if (!handlerFile) {
    sendJson(res, 404, { error: `No handler for ${pathname}` });
    return;
  }
  try {
    // Bust the import cache each request in dev so edits are reflected without restart.
    const moduleUrl = `${pathToFileURL(handlerFile).href}?t=${Date.now()}`;
    const mod = await import(moduleUrl);
    const handler = mod.default;
    if (typeof handler !== "function") {
      sendJson(res, 500, {
        error: `Handler ${apiPath} has no default export`,
      });
      return;
    }
    const rawBody = await readRawBody(req);
    const webReq = nodeReqToWebRequest(req, rawBody);
    const webRes = await handler(webReq);
    if (!(webRes instanceof Response)) {
      sendJson(res, 500, {
        error: `Handler ${apiPath} did not return a Response`,
      });
      return;
    }
    await pipeWebResponse(webRes, res);
  } catch (err) {
    console.error(`[dispatch ${apiPath}]`, err);
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "Handler error",
    });
  }
};

const getAuthenticatedUser = async (req) => {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(match[1]);
  if (error || !data.user?.email) return null;

  const authUser = data.user;
  const email = authUser.email.toLowerCase();
  const metadata = authUser.user_metadata || {};
  const name = metadata.full_name || metadata.name || email.split("@")[0];

  const { data: appUser, error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        email,
        name,
        auth_user_id: authUser.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    )
    .select(
      "id, email, name, payment_status, program_type, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, priority_window_expires_at, converted_to_paid",
    )
    .single();

  if (upsertError) throw new Error(upsertError.message);
  return { authUser, appUser };
};

const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url, true);
  const method = req.method;
  const requestOrigin = req.headers.origin;

  console.log(`[${new Date().toLocaleTimeString()}] ${method} ${pathname}`);

  if (requestOrigin === FRONTEND_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie",
  );
  res.setHeader("Content-Type", "application/json");

  if (method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (pathname === "/api/login" && method === "GET") {
      const { query } = parse(req.url, true);
      const redirect = query.redirect || "/checkout";
      res.writeHead(302, {
        Location: `/auth/login?redirect=${encodeURIComponent(String(redirect))}`,
      });
      res.end();
      return;
    }

    // /api/me — defer to backend/api/me.ts via the file router below. The
    // file handler computes dashboardAccess (paid + calendly + trial_start),
    // which ProtectedRoute relies on. An older inline copy lived here but
    // omitted those fields, causing paid users to be redirected home.

    if (pathname === "/api/dashboard" && method === "GET") {
      const session = await getAuthenticatedUser(req);
      if (!session) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const { appUser } = session;
      const start = appUser.trial_start_date
        ? new Date(appUser.trial_start_date)
        : null;
      const activeDay = start
        ? Math.max(
            1,
            Math.min(
              7,
              Math.floor(
                (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24),
              ) + 1,
            ),
          )
        : null;
      const { data: modules } = await supabase
        .from("training_modules")
        .select("*")
        .eq("active", true)
        .order("trial_day", { ascending: true });
      const { data: metrics } = await supabase
        .from("recovery_metrics")
        .select("*")
        .eq("user_id", appUser.id)
        .order("metric_date", { ascending: false })
        .limit(14);
      const fallbackModules = Array.from({ length: 7 }, (_, index) => ({
        id: `fallback-day-${index + 1}`,
        slug: `trial-day-${index + 1}`,
        title: `Day ${index + 1} Oversight Protocol`,
        description:
          "Complete the daily lesson, log your recovery, and follow the assigned workout.",
        trial_day: index + 1,
        key_takeaways: [
          "Watch the lesson",
          "Log recovery metrics",
          "Complete the workout",
        ],
      }));
      sendJson(res, 200, {
        user: {
          id: appUser.id,
          email: appUser.email,
          name: appUser.name,
          paymentStatus: appUser.payment_status || null,
          programType: appUser.program_type || null,
          hasBookedCalendly: !!appUser.has_booked_calendly,
          trialStartDate: appUser.trial_start_date,
          trialEndDate: appUser.trial_end_date,
          trialCompletedAt: appUser.trial_completed_at,
          priorityWindowExpiresAt: appUser.priority_window_expires_at,
          convertedToPaid: !!appUser.converted_to_paid,
        },
        locked: !appUser.has_booked_calendly || !appUser.trial_start_date,
        activeDay,
        modules: modules?.length ? modules : fallbackModules,
        metrics: metrics || [],
      });
      return;
    }

    if (
      pathname === "/api/metrics" &&
      (method === "GET" || method === "POST")
    ) {
      const session = await getAuthenticatedUser(req);
      if (!session) {
        sendJson(res, 401, { error: "Unauthorized" });
        return;
      }
      const { appUser } = session;
      if (method === "GET") {
        const { data } = await supabase
          .from("recovery_metrics")
          .select("*")
          .eq("user_id", appUser.id)
          .order("metric_date", { ascending: false });
        sendJson(res, 200, { metrics: data || [] });
        return;
      }
      if (!appUser.trial_start_date) {
        sendJson(res, 403, {
          error: "Book your Calendly onboarding before submitting metrics",
        });
        return;
      }
      const body = await readJsonBody(req);
      console.log("[metrics] req.body:", body);
      const trialDay = Number(body.trialDay);
      if (!Number.isInteger(trialDay) || trialDay < 1 || trialDay > 7) {
        sendJson(res, 400, { error: "trialDay must be between 1 and 7" });
        return;
      }
      const metricDate = new Date(appUser.trial_start_date);
      metricDate.setUTCDate(metricDate.getUTCDate() + trialDay - 1);
      const dateKey = metricDate.toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("recovery_metrics")
        .select("id")
        .eq("user_id", appUser.id)
        .eq("metric_date", dateKey)
        .maybeSingle();
      if (existing) {
        sendJson(res, 409, {
          error: "Metrics already submitted for this trial day",
        });
        return;
      }
      const wt = body.workoutType;
      const workoutType =
        wt === "gym" || wt === "home" || wt === "skipped" ? wt : null;
      const moodVal = Number(body.mood);
      const { data, error } = await supabase
        .from("recovery_metrics")
        .insert({
          user_id: appUser.id,
          metric_date: dateKey,
          trial_day: trialDay,
          sleep_quality: Number(body.sleepQuality),
          soreness_level: Number(body.soreness),
          energy_level: Number(body.energyLevel),
          mood: Number.isFinite(moodVal) && moodVal > 0 ? moodVal : null,
          workout_type: workoutType,
          workout_completed: workoutType ? workoutType !== "skipped" : false,
          notes: body.notes || null,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      let completion = null;
      if (trialDay === 7) {
        completion = {
          trialCompletedAt: new Date().toISOString(),
          priorityWindowExpiresAt: new Date(
            Date.now() + 48 * 60 * 60 * 1000,
          ).toISOString(),
        };
        await supabase
          .from("users")
          .update({
            trial_completed_at: completion.trialCompletedAt,
            priority_window_expires_at: completion.priorityWindowExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", appUser.id);
      }
      sendJson(res, 200, { metric: data, completion });
      return;
    }

    if (pathname === "/api/checkout" && method === "POST") {
      // Auth is optional for checkout — Stripe collects customer email at the
      // gateway. If a Bearer token is present we attach the user to metadata.
      let sessionUser = null;
      try {
        sessionUser = await getAuthenticatedUser(req);
      } catch (authErr) {
        console.warn(
          "[checkout] auth lookup failed, continuing as guest:",
          authErr instanceof Error ? authErr.message : authErr,
        );
      }

      const body = await readJsonBody(req);
      console.log("[checkout] req.body:", body);

      const checkoutType = body.checkoutType || "trial";
      let items = (body.items || []).filter(
        (item) =>
          item &&
          typeof item.name === "string" &&
          typeof item.price === "number" &&
          item.quantity > 0,
      );

      // Trial: synthesize a single $149 line if the caller didn't pass one.
      if (items.length === 0 && checkoutType === "trial") {
        items = [
          {
            id: "trial-149",
            slug: `trial-${body.programType || "general"}`,
            name: "7-Day Oversight Trial",
            price: 149,
            quantity: 1,
          },
        ];
      }

      if (items.length === 0) {
        sendJson(res, 400, { error: "Cart is empty" });
        return;
      }

      const computedTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const requestedTotal =
        typeof body.total === "number" ? body.total : computedTotal;

      if (requestedTotal <= 0 || computedTotal <= 0) {
        console.warn("[checkout] Checkout total must be greater than zero", {
          requestedTotal,
          computedTotal,
        });
        sendJson(res, 400, {
          error: "Checkout total must be greater than zero",
        });
        return;
      }

      if (!stripe) {
        console.error("[checkout] STRIPE_SECRET_KEY not configured");
        sendJson(res, 500, {
          error:
            "Stripe is not configured. Set STRIPE_SECRET_KEY on the backend.",
        });
        return;
      }

      console.log("[checkout] Creating Stripe checkout session", {
        itemsCount: items.length,
        requestedTotal,
        computedTotal,
        userId: sessionUser?.appUser.id ?? "(guest)",
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        secretKeyPrefix: process.env.STRIPE_SECRET_KEY
          ? `${process.env.STRIPE_SECRET_KEY.slice(0, 5)}...`
          : "missing",
      });

      const phase2Plans = {
        full: {
          name: "BigRonJones Phase 2 Coaching - Paid in Full",
          unitAmount: 300000,
        },
        six: {
          name: "BigRonJones Phase 2 Coaching - 6-Payment Plan",
          unitAmount: 50000,
        },
        thirtySix: {
          name: "BigRonJones Phase 2 Coaching - 36-Payment Plan",
          unitAmount: 13300,
        },
      };
      const programLabel =
        body.programType === "mens"
          ? " — Men's"
          : body.programType === "womens"
            ? " — Women's"
            : "";

      // Shop purchases use each cart item as its own Stripe line at the real
      // per-item price. Trial/phase2 use a single synthesized line at the
      // fixed plan price. Without the "shop" branch, the trial line ($149)
      // would silently override the actual cart total — buyers of a $79.99
      // call would be charged $149 and routed to Ron's trial-only Calendly.
      const isShop = checkoutType === "shop";
      const lineItems = isShop
        ? items.map((i) => ({
            price_data: {
              currency: "usd" as const,
              product_data: { name: i.name },
              unit_amount: Math.round(i.price * 100),
            },
            quantity: i.quantity,
          }))
        : [
            (() => {
              const line =
                checkoutType === "phase2"
                  ? phase2Plans[body.plan || "full"]
                  : {
                      name: `7-Day Oversight Trial${programLabel}`,
                      unitAmount: 14900,
                    };
              return {
                price_data: {
                  currency: "usd" as const,
                  product_data: { name: line.name },
                  unit_amount: line.unitAmount,
                },
                quantity: 1,
              };
            })(),
          ];

      // dev-server.ts only runs locally — always redirect Stripe back to the
      // Vite frontend on localhost. Never use SITE_URL here (that's the
      // production canonical URL and would bounce dev tests to bigronjones.com).
      const baseUrl = process.env.VITE_SITE_URL || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        // Always have Stripe collect an email so guest orders are reachable.
        ...(sessionUser
          ? { customer_email: sessionUser.appUser.email }
          : body.email
            ? { customer_email: String(body.email).toLowerCase().trim() }
            : {}),
        success_url:
          body.successUrl ||
          (checkoutType === "trial"
            ? `${baseUrl}/trial/success?session_id={CHECKOUT_SESSION_ID}`
            : `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&items=${encodeURIComponent(
                items.map((i) => i.slug).join(","),
              )}`),
        cancel_url:
          body.cancelUrl ||
          (checkoutType === "trial"
            ? `${baseUrl}/programs/trial`
            : `${baseUrl}/cancel`),
        metadata: {
          source: "bigronjones_local_dev",
          checkoutType,
          plan:
            checkoutType === "phase2"
              ? body.plan || "full"
              : checkoutType === "shop"
                ? "shop"
                : "trial",
          programType: body.programType || "",
          userId: sessionUser?.appUser.id ?? "guest",
          userEmail: sessionUser?.appUser.email ?? body.email ?? "",
          items: items.map((item) => `${item.slug}x${item.quantity}`).join(","),
        },
      });

      console.log("[checkout] Stripe session creation response:", session);

      // Trial-only: pre-create / update the trial user record so Calendly
      // can match them by email after they book the discovery call.
      if (checkoutType === "trial" && supabase) {
        const trialEmail = (sessionUser?.appUser.email || body.email || "")
          .toString()
          .toLowerCase()
          .trim();
        if (trialEmail) {
          const updates = {
            email: trialEmail,
            name:
              sessionUser?.appUser.name ||
              body.name ||
              trialEmail.split("@")[0],
            payment_status: "pending",
            stripe_session_id: session.id,
            program_type: body.programType || "general",
            ...(sessionUser?.authUser?.id
              ? { auth_user_id: sessionUser.authUser.id }
              : {}),
            updated_at: new Date().toISOString(),
          };
          const { error: upsertErr } = await supabase
            .from("users")
            .upsert(updates, { onConflict: "email" });
          if (upsertErr) {
            console.error("[checkout] trial user upsert failed:", upsertErr);
          }
        }
      }

      sendJson(res, 200, {
        id: session.id,
        url: session.url,
      });
      return;
    }

    // Fallthrough: any /api/* not handled above is dispatched to a file
    // under backend/api/ — same routing model as Vercel production.
    if (pathname.startsWith("/api/")) {
      await dispatchToHandler(req, res, pathname);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    console.error("[error]", err);
    if (err instanceof Error) {
      console.error("[error stack]", err.stack);
    }
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`\nBackend running on http://localhost:${PORT}`);
  console.log("POST /api/checkout - local checkout endpoint");
  console.log(`Stripe configured: ${stripe ? "yes" : "no"}\n`);
  console.log(
    `STRIPE_SECRET_KEY prefix: ${
      process.env.STRIPE_SECRET_KEY
        ? `${process.env.STRIPE_SECRET_KEY.slice(0, 5)}...`
        : "missing"
    }\n`,
  );
});
