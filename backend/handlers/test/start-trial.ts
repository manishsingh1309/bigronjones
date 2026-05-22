import { createServerSupabase } from "../../lib/supabase";


/**
 * POST /api/test/start-trial   (dev-only — blocked in production)
 *
 * Simulates the Calendly webhook locally so you can exercise the dashboard
 * without exposing localhost via ngrok / Cloudflare Tunnel. Real Calendly
 * webhooks should still be wired to /api/webhooks/calendly in production.
 *
 * Body:
 *   { email: string, backdateDays?: number }
 *
 * Effects on `users` (matched by email):
 *   - has_booked_calendly = true
 *   - trial_start_date    = now() − (backdateDays * 1 day)
 *   - trial_end_date      = trial_start_date + 7 days
 *
 * Use `backdateDays = 6` to land on Day 7 immediately.
 */
export default async function handler(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Disabled in production" }, { status: 403 });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { email?: string; backdateDays?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").toString().toLowerCase().trim();
  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const backdate = Math.min(Math.max(Number(body.backdateDays) || 0, 0), 6);

  const start = new Date(Date.now() - backdate * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const db = createServerSupabase();

  // Upsert: ensure a user row exists (in case checkout never ran).
  const { error: upsertErr } = await db
    .from("users")
    .upsert(
      {
        email,
        name: email.split("@")[0],
        has_booked_calendly: true,
        trial_start_date: start.toISOString(),
        trial_end_date: end.toISOString(),
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

  if (upsertErr) {
    console.error("[test/start-trial] upsert failed:", upsertErr);
    return Response.json({ error: upsertErr.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    email,
    trialStartDate: start.toISOString(),
    trialEndDate: end.toISOString(),
    backdateDays: backdate,
    note: "Refresh /dashboard to see the simulated state.",
  });
}
