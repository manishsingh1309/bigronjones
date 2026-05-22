// GET /api/unsubscribe?email=foo@bar.com&magnet=mass-gain-guide
// Also handles RFC 8058 one-click unsubscribe via POST (List-Unsubscribe-Post).
//
// If `magnet` is provided we pause only that lead's sequence; otherwise we
// pause every lead row sharing that email.
import { createServerSupabase } from "../lib/supabase";


export default async function handler(req: Request): Promise<Response> {
  // Accept both GET (link-click) and POST (one-click compliant clients).
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  const magnet = url.searchParams.get("magnet");

  if (!email) {
    return new Response("Invalid unsubscribe link — missing email.", {
      status: 400,
    });
  }

  try {
    const supabase = createServerSupabase();
    const update = {
      sequence_paused: true,
      status: "unsubscribed",
      updated_at: new Date().toISOString(),
    };

    if (magnet) {
      await supabase
        .from("leads")
        .update(update)
        .eq("email", email)
        .eq("lead_magnet_slug", magnet);
    } else {
      await supabase.from("leads").update(update).eq("email", email);
    }
  } catch (err) {
    console.error("[unsubscribe] db error:", err);
    // Still show the user a confirmation page — failing here would be
    // worse for trust than a silent retry on our side.
  }

  if (req.method === "POST") {
    // RFC 8058 prefers an empty 200 response.
    return new Response(null, { status: 200 });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed | BigRonJones</title>
  <style>
    body { background:#050505; color:#fff; font-family:-apple-system,BlinkMacSystemFont,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; box-sizing:border-box; }
    .container { text-align:center; max-width:420px; }
    .label { font-size:11px; letter-spacing:0.3em; color:#E8192C; margin-bottom:16px; }
    h1 { font-size:2.4rem; font-weight:900; margin:0 0 16px; letter-spacing:0.02em; }
    p { color:#888; line-height:1.7; margin:0 0 24px; }
    a { color:#E8192C; text-decoration:none; }
    a:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <div class="container">
    <p class="label">BIGRONJONES</p>
    <h1>You're unsubscribed.</h1>
    <p>No more emails from this sequence. You can always come back &mdash; the door's open.</p>
    <p><a href="https://bigronjones.com">&larr; Back to BigRonJones</a></p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
