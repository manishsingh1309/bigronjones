import type Stripe from "stripe";
import { createRequire } from "node:module";
import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser } from "../lib/auth";

const require = createRequire(import.meta.url);

type LineItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CheckoutBody = {
  items?: LineItem[];
  total?: number;
  successUrl?: string;
  cancelUrl?: string;
  origin?: string;
  checkoutType?: "trial" | "phase2" | "shop";
  plan?: "full" | "six" | "thirtySix";
  programType?: "mens" | "womens";
  email?: string;
  name?: string;
};

// The user-facing origin for Stripe success/cancel redirects MUST be the site
// the buyer is actually on — never localhost. Validate any supplied origin
// against an allowlist so it can't be abused as an open redirect.
function allowedRedirectOrigin(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    const h = url.hostname;
    if (
      h === "bigronjones.com" ||
      h === "www.bigronjones.com" ||
      h === "localhost" ||
      h === "127.0.0.1"
    ) {
      return `${url.protocol}//${url.host}`;
    }
  } catch {
    /* not a parseable URL — ignore */
  }
  return null;
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

console.log("[checkout] Module loaded", {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  secretKeyPrefix: process.env.STRIPE_SECRET_KEY
    ? `${process.env.STRIPE_SECRET_KEY.slice(0, 5)}...`
    : "missing",
  stripeInitialized: !!stripe,
});


function checkoutLine(
  checkoutType: CheckoutBody["checkoutType"],
  plan: CheckoutBody["plan"],
  programType?: CheckoutBody["programType"],
) {
  if (checkoutType === "phase2") {
    const plans = {
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
    return plans[plan || "full"];
  }

  const programLabel =
    programType === "mens"
      ? " — Men's"
      : programType === "womens"
        ? " — Women's"
        : "";
  return {
    name: `7-Day Oversight Trial${programLabel}`,
    // 7-Day Oversight Trial: $149 one-time (live). Server-authoritative charge.
    unitAmount: 14900,
  };
}

async function upsertTrialUser(
  email: string | null | undefined,
  name: string | null | undefined,
  programType: CheckoutBody["programType"] | undefined,
  stripeSessionId: string | null,
  authUserId: string | null,
) {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return;
  const supabase = createServerSupabase();

  // Read first so we never overwrite an already-paid user back to "pending".
  // Previously this upsert hardcoded payment_status: "pending" on every
  // checkout POST — meaning a paid customer who clicked the trial CTA again
  // (return visit, ad retarget) had their row silently downgraded. The
  // dashboard kept working only because trial_start_date is treated as
  // authoritative, but it left the navbar and downstream reports lying.
  const { data: existing } = await supabase
    .from("users")
    .select("payment_status")
    .eq("email", cleanEmail)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    email: cleanEmail,
    name: (name && name.trim()) || cleanEmail.split("@")[0],
    updated_at: new Date().toISOString(),
  };
  if (programType) updates.program_type = programType;
  if (stripeSessionId) updates.stripe_session_id = stripeSessionId;
  if (authUserId) updates.auth_user_id = authUserId;
  // Only stamp "pending" if there's no row yet, or the prior status was
  // genuinely unset. Never downgrade from paid.
  if (!existing || !existing.payment_status) {
    updates.payment_status = "pending";
  }

  const { error } = await supabase
    .from("users")
    .upsert(updates, { onConflict: "email" });
  if (error) {
    console.error("[checkout] Failed to upsert trial user:", error.message);
  }
}

export default async function handler(req: Request): Promise<Response> {
  console.log("[checkout] Request:", { method: req.method, url: req.url });

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Auth is optional for checkout — Stripe collects the customer email at the
  // gateway. When a Bearer token is present we attach the user to metadata so
  // post-purchase logic can reconcile orders to accounts.
  type AuthSession = Awaited<ReturnType<typeof getAuthenticatedUser>>;
  let appUser: AuthSession["appUser"] | null = null;
  let authUserId: string | null = null;
  try {
    const session = await getAuthenticatedUser(req);
    appUser = session.appUser;
    authUserId = session.authUser.id;
  } catch (error) {
    if (error instanceof Response && error.status !== 401) return error;
    console.warn(
      "[checkout] proceeding as guest:",
      error instanceof Error ? error.message : "no session",
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
    console.log("[checkout] req.body:", body);
  } catch (err) {
    console.error("[checkout] JSON parse error:", err);
    try {
      const raw = req.headers.get("x-raw-body");
      if (raw) console.error("[checkout] Raw body (x-raw-body):", raw);
    } catch {
      /* ignore */
    }
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // For trial checkouts the cart is implicit ($149) — synthesize a single line
  // item if the caller didn't pass one. Phase 2 and shop callers always pass items.
  const checkoutType = body.checkoutType || "trial";
  let items = (body.items || []).filter(
    (i) => i && typeof i.price === "number" && i.quantity > 0,
  );

  if (items.length === 0 && checkoutType === "trial") {
    items = [
      {
        id: "trial-test",
        slug: `trial-${body.programType || "general"}`,
        name: "7-Day Oversight Trial",
        // $149 one-time — mirrors checkoutLine()'s unitAmount (14900) for the
        // total guard, saved order, and metadata.
        price: 149,
        quantity: 1,
      },
    ];
  }

  // Guard the price overrides below. checkoutLine returns the trial $149
  // line by default — if a shop request somehow falls through without
  // checkoutType: "shop", we'd mis-charge the buyer. Be explicit instead.
  const isShop = checkoutType === "shop";

  if (items.length === 0) {
    console.warn("[checkout] No items in cart");
    return Response.json({ error: "Cart is empty" }, { status: 400 });
  }

  const computedTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const requestedTotal =
    typeof body.total === "number" ? body.total : computedTotal;

  console.log("[checkout] Cart total:", {
    requestedTotal,
    computedTotal,
    itemsCount: items.length,
    userId: appUser?.id ?? "(guest)",
  });

  if (requestedTotal <= 0 || computedTotal <= 0) {
    return Response.json(
      { error: "Checkout total must be greater than zero" },
      { status: 400 },
    );
  }

  if (!stripe) {
    console.error("[checkout] STRIPE_SECRET_KEY not configured");
    return Response.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY on the backend.",
      },
      { status: 500 },
    );
  }

  // Vite dev server runs on :3000, backend on :8081 — for the success/cancel
  // URLs we want the user-facing origin, not the API origin.
  //
  // SITE_URL is the canonical PRODUCTION url (used for sitemap/canonical
  // tags), so it MUST NOT be used for Stripe redirects in dev — that would
  // bounce the user to bigronjones.com after a localhost test purchase.
  // VITE_SITE_URL is the user-facing app origin (localhost in dev,
  // production domain in prod). Prefer it.
  // Prefer the SPA-supplied origin / request Origin header (the site the buyer
  // is genuinely on), then trusted env, and finally the canonical production
  // domain. This is what stops real users from being bounced to localhost after
  // paying when the backend's SITE_URL env vars aren't set.
  const baseUrl =
    allowedRedirectOrigin(body.origin) ||
    allowedRedirectOrigin(req.headers.get("origin")) ||
    allowedRedirectOrigin(process.env.VITE_SITE_URL) ||
    allowedRedirectOrigin(process.env.SITE_URL) ||
    "https://www.bigronjones.com";

  // Shop purchases: each cart item is its own Stripe line at its real price.
  // Trial/phase2 purchases: a single synthesized line at the fixed plan price.
  const lineItems = isShop
    ? items.map((i) => ({
        price_data: {
          currency: "usd" as const,
          product_data: { name: i.name },
          unit_amount: Math.round(i.price * 100),
        },
        quantity: i.quantity,
      }))
    : (() => {
        const line = checkoutLine(checkoutType, body.plan, body.programType);
        return [
          {
            price_data: {
              currency: "usd" as const,
              product_data: { name: line.name },
              unit_amount: line.unitAmount,
            },
            quantity: 1,
          },
        ];
      })();

  try {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      ...(appUser
        ? { customer_email: appUser.email }
        : body.email
          ? { customer_email: body.email.toLowerCase().trim() }
          : {}),
      // Append the purchased slugs to the success URL so the confirmation
      // page can render the right post-purchase UI (e.g. Sean's Calendly
      // embed for a nutrition-call buyer) even if the cart was cleared on
      // the user's other device.
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
        source: "bigronjones_website",
        checkoutType,
        plan:
          checkoutType === "phase2"
            ? body.plan || "full"
            : checkoutType === "shop"
              ? "shop"
              : "trial",
        programType: body.programType || "",
        userId: appUser?.id ?? "guest",
        userEmail: appUser?.email ?? body.email ?? "",
        items: items.map((i) => `${i.slug}x${i.quantity}`).join(","),
      },
    };

    console.log("[checkout] Creating Stripe checkout session:", {
      userId: appUser?.id ?? "(guest)",
      checkoutType,
      successUrl: sessionConfig.success_url,
      cancelUrl: sessionConfig.cancel_url,
    });

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log("[checkout] Stripe session creation response:", session);

    if (appUser) {
      await saveOrder(appUser.id, items, requestedTotal, session.id).catch(
        (saveErr) => {
          console.error("[checkout] Failed to save Stripe order:", saveErr);
        },
      );
    }

    // For trial checkouts, pre-create / update the trial user record so the
    // Calendly webhook can find them by email after they book the discovery
    // call. Email comes from the auth session, the request body, or the
    // Stripe customer_email — whichever is available.
    if (checkoutType === "trial") {
      const trialEmail = appUser?.email || body.email || null;
      const trialName = appUser?.name || body.name || null;
      await upsertTrialUser(
        trialEmail,
        trialName,
        body.programType,
        session.id,
        authUserId,
      );
    }

    return Response.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    if (err instanceof Error) {
      console.error("[checkout] Full error stack:", err.stack);
    }

    return Response.json(
      { error: err instanceof Error ? err.message : "Payment setup failed" },
      { status: 500 },
    );
  }
}

async function saveOrder(
  userId: string,
  items: LineItem[],
  total: number,
  stripeSessionId: string | null,
) {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        items,
        total,
        status: "pending",
        stripe_session_id: stripeSessionId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("[checkout] Supabase order save error:", error);
    throw new Error(`Failed to save order: ${error.message}`);
  }

  console.log("[checkout] Order saved:", { orderId: data?.id });
  return data;
}
