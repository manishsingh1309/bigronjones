import { createServerSupabase } from "../lib/supabase";
import {
  validateCalendlySignature,
  parseCalendlyPayload,
} from "../lib/webhookUtils";
import { sendEmail } from "../lib/emailService";
import { addDays } from "date-fns";


interface WebhookEvent {
  event: string;
  data?: Record<string, unknown>;
}

/**
 * POST /api/webhooks/calendly
 *
 * Handles Calendly event subscriptions (invitee.created / event.created)
 *
 * Flow:
 * 1. Validate HMAC SHA256 signature
 * 2. Parse event payload safely
 * 3. Find user by email in database
 * 4. If user exists:
 *    - Mark booking completed (hasBookedCalendly, trialStartDate, trialEndDate)
 *    - Send DAY_1_WELCOME email immediately
 * 5. Log success/failure
 * 6. Return 200 or 400
 */
export default async function handler(req: Request): Promise<Response> {
  // Only accept POST
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Get raw body for signature validation
  const rawBody = await req.text();

  // Validate webhook signature
  const signature = req.headers.get("x-calendly-webhook-signature");
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;

  if (!validateCalendlySignature(rawBody, signature || undefined, secret)) {
    console.warn(
      `Invalid Calendly webhook signature. Payload: ${rawBody.slice(0, 100)}...`,
    );
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Parse event payload
  let payload: WebhookEvent;
  try {
    payload = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    console.error("Failed to parse webhook JSON");
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle booking-completion events.
  if (
    payload.event !== "invitee.created" &&
    payload.event !== "event.created"
  ) {
    return Response.json(
      { skipped: "Not a Calendly booking event" },
      { status: 200 },
    );
  }

  // Parse Calendly data
  const calendlyData = parseCalendlyPayload(payload.data);
  if (!calendlyData) {
    console.error("Failed to extract Calendly data from payload", payload);
    return Response.json(
      { error: "Missing required fields in payload" },
      { status: 400 },
    );
  }

  const { email, name, eventStartTime, eventId } = calendlyData;

  try {
    const db = createServerSupabase();

    // Step 1: Find or create user
    const { data: user, error: selectError } = await db
      .from("users")
      .select("id, name, email, trial_start_date")
      .eq("email", email)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Database error finding user:", selectError);
      return Response.json({ error: "Database error" }, { status: 500 });
    }

    let userId: string;

    if (!user) {
      // Create new user
      const { data: newUser, error: insertError } = await db
        .from("users")
        .insert({
          email,
          name,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to create user:", insertError);
        return Response.json(
          { error: "Failed to create user" },
          { status: 500 },
        );
      }

      userId = newUser.id;
      console.log(`✓ Created new user: ${email} (ID: ${userId})`);
    } else {
      userId = user.id;

      // Check if trial already started
      if (user.trial_start_date) {
        console.warn(
          `User ${email} already has an active trial (started ${user.trial_start_date})`,
        );
        return Response.json(
          { warning: "Trial already started", skipped: true },
          { status: 200 },
        );
      }
    }

    // Step 2: Calculate booking/trial dates
    const trialStartDate = new Date(eventStartTime || Date.now());
    const trialEndDate = addDays(trialStartDate, 7);

    // Step 3: Update user trial fields
    const { error: updateError } = await db
      .from("users")
      .update({
        has_booked_calendly: true,
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        calendly_event_id: eventId || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to update user trial dates:", updateError);
      return Response.json({ error: "Failed to start trial" }, { status: 500 });
    }

    console.log(
      `✓ Booking completed for ${email}. Ends: ${trialEndDate.toISOString()}`,
    );

    // Step 4: Send DAY_1_WELCOME email immediately
    const emailSent = await sendEmail({
      to: email,
      name: name,
      emailType: "DAY_1_WELCOME",
    });

    if (!emailSent) {
      console.error(`Warning: Failed to send welcome email to ${email}`);
      // Don't fail the webhook just because email failed
    }

    // Step 5: Log email in email_logs table
    if (emailSent) {
      await db.from("email_logs").insert({
        user_id: userId,
        email_type: "DAY_1_WELCOME",
        trial_day: 1,
        sent_at: new Date().toISOString(),
      });
    }

    return Response.json(
      {
        success: true,
        userId,
        email,
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        message: "Trial activated and welcome email sent",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unexpected error in Calendly webhook:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
