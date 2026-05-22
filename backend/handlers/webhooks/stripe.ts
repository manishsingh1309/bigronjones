// POST /api/webhooks/stripe
//
// Server-to-server payment confirmation. This is the safety net that fires
// whether or not the customer's browser ever lands on /trial/success — if
// they close the tab on the Stripe confirmation page (common on mobile),
// the existing browser-side verify-trial-payment flow never runs and the
// user looks "unpaid" on next login. The webhook guarantees we mark them
// paid the moment Stripe charges the card.
//
// LOCAL DEV
//   brew install stripe/stripe-cli/stripe
//   stripe login
//   stripe listen --forward-to localhost:8081/api/webhooks/stripe
//   → paste the printed `whsec_…` into .env as STRIPE_WEBHOOK_SECRET
//
// PRODUCTION
//   Stripe Dashboard → Developers → Webhooks → Add endpoint
//     URL:  https://YOUR-DOMAIN/api/webhooks/stripe
//     Events: checkout.session.completed
//             checkout.session.async_payment_succeeded
//             checkout.session.async_payment_failed
//             checkout.session.expired
//   → paste the printed Signing secret into the prod env's
//     STRIPE_WEBHOOK_SECRET. The dashboard issues a SEPARATE secret per
//     endpoint; do NOT reuse the dev CLI secret in prod.
import { createRequire } from "node:module";
import { createServerSupabase } from "../../lib/supabase";

const require = createRequire(import.meta.url);


const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecret ? require("stripe")(stripeSecret) : null;

type StripeCheckoutSession = {
  id: string;
  payment_status?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  metadata?: Record<string, string | undefined> | null;
};

async function markUserPaid(session: StripeCheckoutSession) {
  const rawEmail =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.userEmail ||
    null;
  if (!rawEmail) {
    console.warn("[stripe-webhook] no email on session", session.id);
    return { ok: false, reason: "no-email" as const };
  }
  const email = rawEmail.toLowerCase().trim();
  const programType = session.metadata?.programType || null;
  const checkoutType = session.metadata?.checkoutType || "trial";

  // NOTE: metadata.userId is our app-level users.id, NOT the Supabase auth
  // UUID — do not write it into auth_user_id. The auth_user_id stamp is
  // handled by /api/link-trial the first time the user makes an
  // authenticated request after signing in.

  const db = createServerSupabase();

  const { data: existing, error: lookupErr } = await db
    .from("users")
    .select("id, payment_status, stripe_session_id")
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    console.error("[stripe-webhook] users lookup failed:", lookupErr);
    return { ok: false, reason: "lookup-failed" as const };
  }

  if (existing) {
    const updates: Record<string, unknown> = {
      payment_status: "paid",
      stripe_session_id: session.id,
      updated_at: new Date().toISOString(),
    };
    if (programType) updates.program_type = programType;

    const { error: updErr } = await db
      .from("users")
      .update(updates)
      .eq("id", existing.id);
    if (updErr) {
      console.error("[stripe-webhook] users update failed:", updErr);
      return { ok: false, reason: "update-failed" as const };
    }
  } else {
    // Race: webhook fires before /api/checkout finished its upsert (or the
    // upsert failed silently). Insert so the user is marked paid regardless.
    const { error: insErr } = await db.from("users").insert({
      email,
      name:
        session.customer_details?.name ||
        email.split("@")[0],
      payment_status: "paid",
      stripe_session_id: session.id,
      program_type: programType || (checkoutType === "trial" ? "general" : null),
    });
    if (insErr) {
      console.error("[stripe-webhook] users insert failed:", insErr);
      return { ok: false, reason: "insert-failed" as const };
    }
  }

  // Flip the matching orders row to paid too — admin reports key off this
  // column. Match by stripe_session_id (set in saveOrder()) so a user with
  // multiple historical orders only flips the one Stripe just settled.
  const { error: ordErr } = await db
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("stripe_session_id", session.id);
  if (ordErr) {
    console.warn(
      "[stripe-webhook] orders status update non-fatal:",
      ordErr.message,
    );
  }

  return { ok: true as const, email };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!stripe) {
    console.error("[stripe-webhook] STRIPE_SECRET_KEY not configured");
    return Response.json(
      { error: "Stripe not configured" },
      { status: 500 },
    );
  }
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return Response.json(
      { error: "Webhook signing secret not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature is computed over the EXACT raw body bytes — any reformatting
  // (e.g. JSON.parse → JSON.stringify) breaks verification. The dev-server's
  // file router passes the raw Buffer through as the Request body, and on
  // Vercel the Node runtime preserves the original bytes as well.
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error(
      "[stripe-webhook] signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[stripe-webhook] event", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as StripeCheckoutSession;
        // For instant card payments `payment_status` is "paid" by the time
        // completed fires. For async methods (bank transfer etc.) the
        // completed event can fire with payment_status="unpaid" and a
        // later async_payment_succeeded settles it. Only mark paid when
        // Stripe actually says paid — otherwise we'd grant trial access on
        // an unsettled transfer.
        if (session.payment_status === "paid") {
          const result = await markUserPaid(session);
          console.log("[stripe-webhook] markUserPaid", {
            sessionId: session.id,
            result,
          });
        } else {
          console.log("[stripe-webhook] session not yet paid", {
            sessionId: session.id,
            paymentStatus: session.payment_status,
          });
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as StripeCheckoutSession;
        const db = createServerSupabase();
        await db
          .from("orders")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("stripe_session_id", session.id);
        console.log("[stripe-webhook] async payment failed", session.id);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as StripeCheckoutSession;
        const db = createServerSupabase();
        // Only mark order expired if it was still pending — never overwrite
        // a completed/refunded state.
        await db
          .from("orders")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("stripe_session_id", session.id)
          .eq("status", "pending");
        console.log("[stripe-webhook] session expired", session.id);
        break;
      }
      default:
        // Unhandled event types are returned as 200 so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    console.error(
      "[stripe-webhook] handler error:",
      err instanceof Error ? err.message : err,
    );
    // Return 500 so Stripe retries with exponential backoff.
    return Response.json({ error: "Handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
