// POST /api/verify-trial-payment  { session_id }
//
// Confirms a Stripe checkout session has been paid and flips the
// corresponding `users` row from payment_status='pending' to 'paid'. The
// dashboard still stays locked until Calendly booking is completed.
//
// We verify against Stripe's API (not just trust the URL) so a forged
// session_id can't unlock a free trial.
import Stripe from "stripe";
import { createServerSupabase } from "../lib/supabase";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!stripe) {
    return Response.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let body: { session_id?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const sessionId = (body.session_id || "").toString().trim();
  if (!sessionId) {
    return Response.json({ error: "session_id is required" }, { status: 400 });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error("[verify-trial-payment] retrieve failed:", err);
    return Response.json(
      { error: "Stripe session not found" },
      { status: 404 },
    );
  }

  // Stripe's `payment_status` is 'paid' once the charge has settled.
  // For checkout.sessions.mode='payment' this means the user actually paid.
  if (session.payment_status !== "paid") {
    return Response.json(
      {
        verified: false,
        paymentStatus: session.payment_status,
        message: "Payment not yet confirmed",
      },
      { status: 200 },
    );
  }

  // Pull the email Stripe collected (or set in metadata).
  const email =
    (session.customer_details?.email as string | undefined) ||
    (session.customer_email as string | undefined) ||
    (session.metadata?.userEmail as string | undefined) ||
    null;

  if (!email) {
    return Response.json(
      {
        verified: true,
        paymentStatus: "paid",
        message: "Paid but no email found on session",
      },
      { status: 200 },
    );
  }

  const supabase = createServerSupabase();
  const cleanEmail = email.toLowerCase().trim();

  const now = new Date();

  const updates: Record<string, unknown> = {
    payment_status: "paid",
    stripe_session_id: sessionId,
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("email", cleanEmail)
    .select("id, email, payment_status, trial_start_date, trial_end_date")
    .maybeSingle();

  if (error) {
    console.error("[verify-trial-payment] supabase update failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Edge case: the upsert at checkout time might have failed (e.g. Supabase
  // misconfigured). Create the row now so the dashboard works.
  if (!data) {
    const { error: insertErr } = await supabase.from("users").insert({
      email: cleanEmail,
      name:
        (session.customer_details?.name as string | undefined) ||
        cleanEmail.split("@")[0],
      payment_status: "paid",
      stripe_session_id: sessionId,
      program_type: session.metadata?.programType || "general",
    });
    if (insertErr) {
      console.error(
        "[verify-trial-payment] insert fallback failed:",
        insertErr,
      );
      return Response.json({ error: insertErr.message }, { status: 500 });
    }
  }

  return Response.json({
    verified: true,
    paymentStatus: "paid",
    email: cleanEmail,
  });
}
