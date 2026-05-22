import { createServerSupabase } from "../lib/supabase";
import { sendEmail, type EmailType } from "../lib/emailService";


/**
 * POST /api/test-webhook-calendly  (dev-only — blocked in production)
 *
 * Testing endpoint for Calendly webhook
 * Helps debug signature validation and email sending
 *
 * Body:
 * {
 *   "email": "test@example.com",
 *   "name": "Test User",
 *   "eventStartTime": "2025-05-10T10:00:00Z",
 *   "testEmailType": "DAY_1_WELCOME" // optional
 * }
 */
export default async function handler(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Disabled in production" }, { status: 403 });
  }
  // Only allow POST
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const name = String(body.name || "").trim();
  const eventStartTime = String(body.eventStartTime || "").trim();
  const testEmailType = (body.testEmailType as string) || "DAY_1_WELCOME";

  // Validate inputs
  if (!email || !name || !eventStartTime) {
    return Response.json(
      {
        error: "Missing required fields",
        required: ["email", "name", "eventStartTime"],
      },
      { status: 400 },
    );
  }

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Parse date
    const date = new Date(eventStartTime);
    if (isNaN(date.getTime())) {
      return Response.json(
        { error: "Invalid date format (use ISO 8601)" },
        { status: 400 },
      );
    }

    console.log(
      `[TEST] Processing webhook for ${email} (${name}) on ${eventStartTime}`,
    );

    const db = createServerSupabase();

    // Test 1: Create/update user
    const { data: existingUser } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`[TEST] Found existing user: ${userId}`);
    } else {
      const { data: newUser, error: insertError } = await db
        .from("users")
        .insert({ email, name })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(`Failed to create user: ${insertError.message}`);
      }
      userId = newUser.id;
      console.log(`[TEST] Created new user: ${userId}`);
    }

    // Test 2: Send test email
    console.log(`[TEST] Sending test email (type: ${testEmailType})...`);
    const emailSent = await sendEmail({
      to: email,
      name,
      emailType: testEmailType as EmailType,
    });

    if (!emailSent) {
      throw new Error("Failed to send email");
    }

    console.log(`[TEST] Email sent successfully`);

    // Test 3: Log email
    const { error: logError } = await db.from("email_logs").insert({
      user_id: userId,
      email_type: testEmailType,
      trial_day: 1,
      sent_at: new Date().toISOString(),
    });

    if (logError) {
      console.warn(
        `[TEST] Failed to log email (non-fatal): ${logError.message}`,
      );
    }

    return Response.json(
      {
        success: true,
        message: "Test webhook processed successfully",
        data: {
          userId,
          email,
          name,
          eventStartTime,
          emailType: testEmailType,
          emailSent: true,
          testEndpoint: true,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[TEST] Error:", error);
    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}
