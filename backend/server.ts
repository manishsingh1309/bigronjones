// Production HTTP server. Bundled and run on Render (or any Node host).
// Dispatches /api/* requests via the static manifest in handlers/manifest.ts —
// the same routing source-of-truth the Vercel single-function path used to
// import. Local dev still uses backend/dev-server.ts (file-based router +
// hot reload).
//
// Required env on host:
//   PORT             — Render injects this; default 8081 locally
//   FRONTEND_ORIGIN  — exact origin allowed for CORS (e.g. https://bigronjones.com)
//                      Use "*" to allow any (NOT recommended in prod).
//
// Health check at GET /healthz (Render polls this).

import http from "node:http";
import { parse } from "node:url";
import { handlerMap } from "./handlers/manifest";

const PORT = Number(process.env.PORT || 8081);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";

const readRawBody = (req: http.IncomingMessage): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });

const nodeReqToWebRequest = (
  req: http.IncomingMessage,
  rawBody: Buffer,
): Request => {
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = (req.headers.host as string) || `localhost:${PORT}`;
  const url = `${proto}://${host}${req.url ?? "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value))
      value.forEach((v) => headers.append(key, String(v)));
    else headers.set(key, String(value));
  }
  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD" && rawBody.length > 0) {
    init.body = rawBody;
    // Node 18+ requires duplex: 'half' when body is a buffer/stream.
    // @ts-expect-error duplex is valid in Node's undici Request
    init.duplex = "half";
  }
  return new Request(url, init);
};

const pipeWebResponse = async (
  webRes: Response,
  nodeRes: http.ServerResponse,
) => {
  const buf = Buffer.from(await webRes.arrayBuffer());
  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") return;
    nodeRes.setHeader(key, value);
  });
  nodeRes.statusCode = webRes.status;
  nodeRes.end(buf);
};

const applyCors = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
): void => {
  const requestOrigin = (req.headers.origin as string | undefined) ?? "";
  // Echo the request origin only if it matches the allowlist or allowlist
  // is "*". Webhooks and same-origin proxied calls won't send Origin and
  // don't need CORS, so leaving the header off is fine in that case.
  let allowOrigin = "";
  if (FRONTEND_ORIGIN === "*") allowOrigin = requestOrigin || "*";
  else if (requestOrigin && requestOrigin === FRONTEND_ORIGIN)
    allowOrigin = requestOrigin;

  if (allowOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie, stripe-signature",
  );
};

const sendJson = (
  res: http.ServerResponse,
  status: number,
  payload: unknown,
) => {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = status;
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url || "/", true);
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Render's health probe + a sanity-check "is anything alive" root.
  if (pathname === "/healthz" || pathname === "/") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (!pathname || !pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  const apiPath = pathname.replace(/^\/api\//, "").replace(/\/+$/, "");
  const handler = handlerMap[apiPath];
  if (!handler) {
    sendJson(res, 404, { error: `No handler for ${pathname}` });
    return;
  }

  try {
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
    console.error(`[api/${apiPath}]`, err);
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
  console.log(
    `FRONTEND_ORIGIN: ${FRONTEND_ORIGIN || "(empty — CORS will be no-op)"}`,
  );
});
