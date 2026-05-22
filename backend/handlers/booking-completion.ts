import { addDays } from "date-fns";
import { createRequire } from "node:module";
import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser } from "../lib/auth";


const require = createRequire(import.meta.url);
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

type Body = {
  email?: string;
  calendlyEventId?: string;
  bookingTime?: string;
  sessionId?: string;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let email = (body.email || "").toString().toLowerCase().trim();
  const calendlyEventId = (body.calendlyEventId || "").toString().trim();
  const bookingTime = body.bookingTime
    ? new Date(body.bookingTime)
    : new Date();

  // Prefer the authenticated user's email over whatever Calendly handed us —
  // users can book under a different email than they registered with, which
  // would orphan the trial row. Auth is the ground truth.
  try {
    const session = await getAuthenticatedUser(req);
    if (session?.appUser?.email) {
      email = session.appUser.email.toLowerCase().trim();
    }
  } catch (err) {
    // No / invalid session — fall through to email / sessionId lookup
    if (!(err instanceof Response)) {
      console.warn(
        "[booking-completion] auth lookup non-fatal error:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (!email && body.sessionId && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(body.sessionId);
      email =
        (session.customer_details?.email as string | undefined) ||
        (session.customer_email as string | undefined) ||
        (session.metadata?.userEmail as string | undefined) ||
        "";
      email = email.toLowerCase().trim();
    } catch (err) {
      console.error("[booking-completion] Stripe session lookup failed:", err);
    }
  }

  if (!email) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id, payment_status, has_booked_calendly, trial_start_date")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("[booking-completion] lookup failed:", lookupError);
    return Response.json({ error: lookupError.message }, { status: 500 });
  }

  // Stripe verification may still be in flight when the user finishes the
  // Calendly booking on a slow network. If a sessionId is provided and the
  // user record isn't marked paid yet, retrieve the Stripe session and flip
  // payment_status here so the booking + trial start are recorded atomically.
  let paymentStatus = existing?.payment_status || null;
  if (paymentStatus !== "paid" && body.sessionId && stripe) {
    try {
      const session = await stripe.checkout.sessions.retrieve(body.sessionId);
      if (session.payment_status === "paid") {
        paymentStatus = "paid";
      }
    } catch (err) {
      console.error(
        "[booking-completion] inline Stripe verify failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  if (!existing) {
    return Response.json(
      { error: "User record not found — complete checkout first" },
      { status: 404 },
    );
  }

  if (paymentStatus !== "paid") {
    return Response.json(
      { error: "Payment has not been confirmed yet" },
      { status: 402 },
    );
  }

  const trialStart = Number.isNaN(bookingTime.getTime())
    ? new Date()
    : bookingTime;
  const trialEnd = addDays(trialStart, 7);

  // Atomic write: payment_status, booking flag, and trial dates all land in
  // one update so a re-login mid-flow can never see a half-activated trial.
  const { data, error } = await supabase
    .from("users")
    .update({
      payment_status: "paid",
      has_booked_calendly: true,
      trial_start_date: trialStart.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      calendly_event_id: calendlyEventId || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("email", email)
    .select(
      "id, email, payment_status, has_booked_calendly, trial_start_date, trial_end_date, calendly_event_id",
    )
    .maybeSingle();

  if (error) {
    console.error("[booking-completion] update failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log("[booking-completion] booking stored", {
    email,
    calendlyEventId,
    bookingTime: trialStart.toISOString(),
  });

  return Response.json({
    success: true,
    bookingCompleted: true,
    bookingTime: trialStart.toISOString(),
    calendlyEventId: calendlyEventId || null,
    email,
    user: data,
  });
}
