import { createServerSupabase } from "../../lib/supabase";
import { sendEmail, type EmailType } from "../../lib/emailService";
import { differenceInDays } from "date-fns";

interface UserTrialData {
  id: string;
  email: string;
  name: string;
  trial_start_date: string;
  trial_end_date: string;
  trial_completed_at: string | null;
}

interface RecoveryMetrics {
  energy_level: number | null;
  soreness_level: number | null;
}

/**
 * Email schedule mapping: only these 5 emails on these days
 */
const EMAIL_SCHEDULE: Record<number, EmailType> = {
  1: "DAY_1_WELCOME",
  2: "DAY_2_EDUCATION",
  4: "DAY_4_REINFORCEMENT",
  6: "DAY_6_PUSH",
  7: "DAY_7_CONVERSION",
};

/**
 * Calculates which day of trial a user is on
 * Day 1 = first full day after booking
 *
 * @param trialStartDate ISO timestamp
 * @returns 1-7 or >7 if past trial end
 */
function calculateTrialDay(trialStartDate: string): number {
  const startDate = new Date(trialStartDate);
  const now = new Date();
  const daysPassed = differenceInDays(now, startDate);
  return daysPassed + 1;
}

/**
 * Gets the latest recovery metrics for a user to personalize email
 */
async function getLatestRecoveryMetrics(
  db: ReturnType<typeof createServerSupabase>,
  userId: string,
): Promise<RecoveryMetrics | null> {
  const { data, error } = await db
    .from("recovery_metrics")
    .select("energy_level, soreness_level")
    .eq("user_id", userId)
    .order("metric_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data || null;
}

/**
 * Checks if email has already been sent (duplicate prevention)
 */
async function hasEmailBeenSent(
  db: ReturnType<typeof createServerSupabase>,
  userId: string,
  emailType: EmailType,
  trialDay: number,
): Promise<boolean> {
  const { data, error } = await db
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .eq("trial_day", trialDay)
    .single();

  if (error && error.code !== "PGRST116") {
    // Log unexpected errors, but treat as "not sent"
    console.error("Error checking email log:", error);
  }

  return !!data;
}

/**
 * Logs email send attempt
 */
async function logEmailSend(
  db: ReturnType<typeof createServerSupabase>,
  userId: string,
  emailType: EmailType,
  trialDay: number,
  success: boolean,
  errorMessage?: string,
): Promise<void> {
  const logData = {
    user_id: userId,
    email_type: emailType,
    trial_day: trialDay,
    sent_at: new Date().toISOString(),
    send_attempt_count: 1,
    ...(errorMessage && { error_message: errorMessage }),
  };

  if (!success) {
    logData.last_retry_at = new Date().toISOString();
  }

  await db.from("email_logs").insert(logData).then();
}

/**
 * Main scheduler function
 * Run daily via cron job to send emails on schedule
 *
 * Usage:
 *   await runEmailScheduler()
 *
 * Or as a cron handler:
 *   POST /api/cron/email-scheduler?secret=CRON_SECRET
 */
export async function runEmailScheduler(): Promise<{
  emailsSent: number;
  skipped: number;
  errors: number;
  details: Array<{ email: string; status: string; day: number }>;
}> {
  const db = createServerSupabase();
  const stats = {
    emailsSent: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{ email: string; status: string; day: number }>,
  };

  try {
    // Step 1: Query active trials
    const { data: activeUsers, error: queryError } = await db
      .from("users")
      .select(
        "id, email, name, trial_start_date, trial_end_date, trial_completed_at",
      )
      .is("trial_completed_at", null) // Only incomplete trials
      .not("trial_start_date", "is", null); // Only started trials

    if (queryError) {
      console.error("Failed to query active trials:", queryError);
      return stats;
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.log("No active trials to process");
      return stats;
    }

    console.log(`Processing ${activeUsers.length} active trials`);

    // Step 2: Process each user
    for (const user of activeUsers as UserTrialData[]) {
      const trialDay = calculateTrialDay(user.trial_start_date);
      const trialEndDate = new Date(user.trial_end_date);
      const now = new Date();

      // Check if trial is still active
      if (now > trialEndDate) {
        // Mark trial as completed
        await db
          .from("users")
          .update({
            trial_completed_at: now.toISOString(),
          })
          .eq("id", user.id);

        stats.skipped++;
        stats.details.push({
          email: user.email,
          status: "trial_ended",
          day: trialDay,
        });
        continue;
      }

      // Check if email should be sent today
      const emailType = EMAIL_SCHEDULE[trialDay];
      if (!emailType) {
        // No email scheduled for this day
        stats.skipped++;
        stats.details.push({
          email: user.email,
          status: "no_email_today",
          day: trialDay,
        });
        continue;
      }

      // Check if already sent
      const alreadySent = await hasEmailBeenSent(
        db,
        user.id,
        emailType,
        trialDay,
      );
      if (alreadySent) {
        stats.skipped++;
        stats.details.push({
          email: user.email,
          status: "already_sent",
          day: trialDay,
        });
        continue;
      }

      // Get recovery metrics for personalization
      const metrics = await getLatestRecoveryMetrics(db, user.id);

      // Send email
      try {
        const sent = await sendEmail({
          to: user.email,
          name: user.name,
          emailType,
          energyLevel: metrics?.energy_level || undefined,
          sorenessLevel: metrics?.soreness_level || undefined,
        });

        if (sent) {
          await logEmailSend(db, user.id, emailType, trialDay, true);
          stats.emailsSent++;
          stats.details.push({
            email: user.email,
            status: "sent",
            day: trialDay,
          });
          console.log(`✓ Sent ${emailType} to ${user.email} (Day ${trialDay})`);
        } else {
          await logEmailSend(
            db,
            user.id,
            emailType,
            trialDay,
            false,
            "Email send failed",
          );
          stats.errors++;
          stats.details.push({
            email: user.email,
            status: "send_failed",
            day: trialDay,
          });
          console.error(
            `✗ Failed to send ${emailType} to ${user.email} (Day ${trialDay})`,
          );
        }
      } catch (error) {
        await logEmailSend(
          db,
          user.id,
          emailType,
          trialDay,
          false,
          String(error),
        );
        stats.errors++;
        stats.details.push({
          email: user.email,
          status: "error",
          day: trialDay,
        });
        console.error(`✗ Error sending ${emailType} to ${user.email}:`, error);
      }
    }

    console.log(
      `Scheduler complete: ${stats.emailsSent} sent, ${stats.skipped} skipped, ${stats.errors} errors`,
    );
    return stats;
  } catch (error) {
    console.error("Fatal error in email scheduler:", error);
    throw error;
  }
}

// Export as a handler for Vercel cron

export default async function handler(req: Request): Promise<Response> {
  // Require CRON_SECRET for protection
  const url = new URL(req.url);
  const providedSecret = url.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || providedSecret !== cronSecret) {
    console.warn(
      `Unauthorized cron attempt from ${req.headers.get("x-forwarded-for") || "unknown"}`,
    );
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runEmailScheduler();
    return Response.json(stats, { status: 200 });
  } catch (error) {
    console.error("Cron handler error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
