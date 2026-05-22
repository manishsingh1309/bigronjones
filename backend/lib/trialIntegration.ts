import { createServerSupabase } from "./supabase";
import { sendEmail } from "./emailService";
import { addDays } from "date-fns";

/**
 * INTEGRATION EXAMPLES
 *
 * This file shows how to integrate the trial system into your existing codebase
 */

// =====================================================================
// Example 1: Manually Create a Trial (Admin/Internal Use)
// =====================================================================
export async function createTrialForUser(
  email: string,
  name: string,
  trialStartDate: Date = new Date(),
) {
  const db = createServerSupabase();

  const trialEndDate = addDays(trialStartDate, 7);

  // Create or update user
  const { data: existingUser } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  let userId: string;

  if (!existingUser) {
    const { data: newUser } = await db
      .from("users")
      .insert({ email, name })
      .select("id")
      .single();
    userId = newUser.id;
  } else {
    userId = existingUser.id;
  }

  // Update trial fields
  await db
    .from("users")
    .update({
      has_booked_calendly: true,
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
    })
    .eq("id", userId);

  // Send welcome email
  await sendEmail({
    to: email,
    name,
    emailType: "DAY_1_WELCOME",
  });

  return { userId, trialStartDate, trialEndDate };
}

// =====================================================================
// Example 2: Log Recovery Metric (Called from frontend)
// =====================================================================
export async function logRecoveryMetric(
  userId: string,
  date: Date,
  data: {
    energyLevel?: number;
    sorenessLevel?: number;
    sleepHours?: number;
    sleepQuality?: number;
    restingHeartRate?: number;
    heartRateVariability?: number;
    steps?: number;
    waterIntakeLiters?: number;
    notes?: string;
  },
) {
  const db = createServerSupabase();

  const metricDate = date.toISOString().split("T")[0]; // YYYY-MM-DD

  // Validate energy and soreness are in range
  if (data.energyLevel && (data.energyLevel < 1 || data.energyLevel > 10)) {
    throw new Error("Energy level must be 1-10");
  }
  if (
    data.sorenessLevel &&
    (data.sorenessLevel < 0 || data.sorenessLevel > 10)
  ) {
    throw new Error("Soreness level must be 0-10");
  }

  const { error } = await db.from("recovery_metrics").upsert({
    user_id: userId,
    metric_date: metricDate,
    energy_level: data.energyLevel || null,
    soreness_level: data.sorenessLevel || null,
    sleep_hours: data.sleepHours || null,
    sleep_quality: data.sleepQuality || null,
    resting_heart_rate: data.restingHeartRate || null,
    heart_rate_variability: data.heartRateVariability || null,
    steps: data.steps || null,
    water_intake_liters: data.waterIntakeLiters || null,
    notes: data.notes || null,
  });

  if (error) {
    throw new Error(`Failed to log recovery metric: ${error.message}`);
  }
}

// =====================================================================
// Example 3: Check Trial Status
// =====================================================================
export async function getTrialStatus(userId: string) {
  const db = createServerSupabase();

  const { data: user, error } = await db
    .from("users")
    .select(
      "email, name, trial_start_date, trial_end_date, trial_completed_at, converted_to_paid",
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("User not found");
  }

  if (!user.trial_start_date) {
    return { status: "no_trial", user };
  }

  const now = new Date();
  const trialEnd = new Date(user.trial_end_date);
  const trialStart = new Date(user.trial_start_date);

  if (user.trial_completed_at) {
    return {
      status: "completed",
      completedDate: user.trial_completed_at,
      convertedToPaid: user.converted_to_paid,
      user,
    };
  }

  if (now > trialEnd) {
    return { status: "expired", user };
  }

  const daysElapsed = Math.floor(
    (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysRemaining = 7 - daysElapsed;

  return {
    status: "active",
    daysElapsed: daysElapsed + 1, // 1-indexed
    daysRemaining,
    user,
  };
}

// =====================================================================
// Example 4: Get User's Recovery Metrics
// =====================================================================
export async function getRecoveryMetrics(userId: string, days: number = 7) {
  const db = createServerSupabase();

  const { data: metrics, error } = await db
    .from("recovery_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("metric_date", { ascending: false })
    .limit(days);

  if (error) {
    throw new Error(`Failed to fetch metrics: ${error.message}`);
  }

  return metrics;
}

// =====================================================================
// Example 5: Convert User to Paid
// =====================================================================
export async function convertToPaidProgram(
  userId: string,
  stripeProgramId: string,
) {
  const db = createServerSupabase();

  const { error } = await db
    .from("users")
    .update({
      converted_to_paid: true,
      trial_completed_at: new Date().toISOString(),
      paid_program_id: stripeProgramId,
      paid_start_date: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to convert user: ${error.message}`);
  }

  return { success: true, userId, stripeProgramId };
}

// =====================================================================
// Example 6: Get Email History for User
// =====================================================================
export async function getEmailHistory(userId: string) {
  const db = createServerSupabase();

  const { data: emails, error } = await db
    .from("email_logs")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch emails: ${error.message}`);
  }

  return emails;
}

// =====================================================================
// Example 7: Get Training Module for Trial Day
// =====================================================================
export async function getTrainingModuleForDay(
  day: number,
  programType: string = "general",
) {
  const db = createServerSupabase();

  const { data: module, error } = await db
    .from("training_modules")
    .select("*")
    .eq("trial_day", day)
    .eq("program_type", programType)
    .eq("active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch module: ${error.message}`);
  }

  return module || null;
}

// =====================================================================
// Example 8: Create Training Module (Admin)
// =====================================================================
export async function createTrainingModule(data: {
  slug: string;
  title: string;
  description?: string;
  contentHtml: string;
  keyTakeaways?: string[];
  videoUrl?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  programType?: string;
  trialDay: number;
  durationMinutes?: number;
}) {
  const db = createServerSupabase();

  const { data: module, error } = await db
    .from("training_modules")
    .insert({
      slug: data.slug,
      title: data.title,
      description: data.description,
      content_html: data.contentHtml,
      key_takeaways: data.keyTakeaways || [],
      video_url: data.videoUrl,
      difficulty: data.difficulty || "intermediate",
      program_type: data.programType || "general",
      trial_day: data.trialDay,
      duration_minutes: data.durationMinutes,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create module: ${error.message}`);
  }

  return module;
}

// =====================================================================
// DATABASE QUERIES FOR ANALYTICS
// =====================================================================

export const analyticsQueries = {
  // Trial conversion funnel
  trialConversionFunnel: `
    SELECT 
      COUNT(*) as total_trials,
      COUNT(CASE WHEN trial_end_date > NOW() THEN 1 END) as active_trials,
      COUNT(CASE WHEN trial_completed_at IS NOT NULL THEN 1 END) as completed_trials,
      COUNT(CASE WHEN converted_to_paid = true THEN 1 END) as paid_conversions,
      ROUND(
        100.0 * COUNT(CASE WHEN converted_to_paid = true THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN trial_completed_at IS NOT NULL THEN 1 END), 0),
        2
      ) as conversion_rate_pct
    FROM users
    WHERE trial_start_date IS NOT NULL;
  `,

  // Email engagement by type
  emailEngagement: `
    SELECT 
      email_type,
      COUNT(*) as sent,
      COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opens,
      COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicks,
      ROUND(100.0 * COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as open_rate_pct,
      ROUND(100.0 * COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) / COUNT(*), 2) as ctr_pct
    FROM email_logs
    GROUP BY email_type
    ORDER BY sent DESC;
  `,

  // Average trial metrics by day
  recoveryMetricsByDay: `
    SELECT 
      ROUND(AVG((NOW()::date - metric_date)::int), 0) as day_of_trial,
      ROUND(AVG(energy_level), 2) as avg_energy,
      ROUND(AVG(soreness_level), 2) as avg_soreness,
      ROUND(AVG(sleep_hours), 2) as avg_sleep,
      COUNT(*) as users_reporting
    FROM recovery_metrics
    GROUP BY ROUND(AVG((NOW()::date - metric_date)::int), 0)
    ORDER BY day_of_trial;
  `,

  // Trial completion timeline
  trialCompletionTimeline: `
    SELECT 
      DATE(trial_completed_at) as date,
      COUNT(*) as trials_completed,
      COUNT(CASE WHEN converted_to_paid = true THEN 1 END) as conversions,
      ROUND(
        100.0 * COUNT(CASE WHEN converted_to_paid = true THEN 1 END) / COUNT(*),
        2
      ) as conversion_rate_pct
    FROM users
    WHERE trial_completed_at IS NOT NULL
    GROUP BY DATE(trial_completed_at)
    ORDER BY date DESC;
  `,

  // User segmentation by program type
  usersByProgram: `
    SELECT 
      program_type,
      COUNT(*) as total_users,
      COUNT(CASE WHEN trial_start_date IS NOT NULL THEN 1 END) as with_trial,
      COUNT(CASE WHEN converted_to_paid = true THEN 1 END) as paid_users
    FROM users
    GROUP BY program_type;
  `,
};

// =====================================================================
// USAGE IN API ENDPOINTS
// =====================================================================

/*
Example: POST /api/dashboard/recovery-metric

import { logRecoveryMetric, getTrialStatus } from "../lib/trialIntegration";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  try {
    // Log the metric
    await logRecoveryMetric(userId, new Date(), {
      energyLevel: body.energyLevel,
      sorenessLevel: body.sorenessLevel,
      sleepHours: body.sleepHours,
      sleepQuality: body.sleepQuality,
      notes: body.notes,
    });

    // Get updated trial status
    const status = await getTrialStatus(userId);

    return Response.json({
      success: true,
      message: "Recovery metric logged",
      trialStatus: status,
    });
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
*/
