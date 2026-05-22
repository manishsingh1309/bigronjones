import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser } from "../lib/auth";


type MetricsBody = {
  sleepQuality?: number;
  soreness?: number;
  energyLevel?: number;
  mood?: number;
  trialDay?: number;
  notes?: string;
  workoutType?: "gym" | "home" | "skipped";
};

function metricDateForTrialDay(trialStartDate: string, trialDay: number) {
  const date = new Date(trialStartDate);
  date.setUTCDate(date.getUTCDate() + trialDay - 1);
  return date.toISOString().split("T")[0];
}

function asScore(value: unknown, name: string, min = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${name} is required`);
  }
  if (value < min || value > 10) {
    throw new Error(`${name} must be between ${min} and 10`);
  }
  return Math.round(value);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET" && req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { appUser } = await getAuthenticatedUser(req);
    const db = createServerSupabase();

    if (req.method === "GET") {
      const { data, error } = await db
        .from("recovery_metrics")
        .select("*")
        .eq("user_id", appUser.id)
        .order("metric_date", { ascending: false });

      if (error) throw new Error(error.message);
      return Response.json({ metrics: data || [] });
    }

    if (!appUser.trial_start_date) {
      return Response.json(
        { error: "Book your Calendly onboarding before submitting metrics" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as MetricsBody;
    console.log("[metrics] req.body:", body);

    const trialDay = asScore(body.trialDay, "trialDay");
    if (trialDay > 7) throw new Error("trialDay must be between 1 and 7");

    const metricDate = metricDateForTrialDay(appUser.trial_start_date, trialDay);
    const workoutType =
      body.workoutType === "gym" ||
      body.workoutType === "home" ||
      body.workoutType === "skipped"
        ? body.workoutType
        : null;
    const payload = {
      user_id: appUser.id,
      metric_date: metricDate,
      trial_day: trialDay,
      sleep_quality: asScore(body.sleepQuality, "sleepQuality"),
      soreness_level: asScore(body.soreness, "soreness", 0),
      energy_level: asScore(body.energyLevel, "energyLevel"),
      mood:
        typeof body.mood === "number" ? asScore(body.mood, "mood") : null,
      workout_type: workoutType,
      workout_completed: workoutType ? workoutType !== "skipped" : false,
      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: existingError } = await db
      .from("recovery_metrics")
      .select("id")
      .eq("user_id", appUser.id)
      .eq("metric_date", metricDate)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) {
      return Response.json(
        { error: "Metrics already submitted for this trial day" },
        { status: 409 },
      );
    }

    const { data, error } = await db
      .from("recovery_metrics")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    let completion = null;
    if (trialDay === 7) {
      const priorityWindowExpiresAt = new Date(
        Date.now() + 48 * 60 * 60 * 1000,
      ).toISOString();
      const trialCompletedAt = new Date().toISOString();

      const { error: updateError } = await db
        .from("users")
        .update({
          trial_completed_at: trialCompletedAt,
          priority_window_expires_at: priorityWindowExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", appUser.id);

      if (updateError) throw new Error(updateError.message);
      completion = { trialCompletedAt, priorityWindowExpiresAt };
    }

    return Response.json({ metric: data, completion });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Invalid metrics";
    const status = /required|between|trialDay/.test(message) ? 400 : 500;
    if (status === 500) console.error("[metrics] Error:", error);
    return Response.json({ error: message }, { status });
  }
}
