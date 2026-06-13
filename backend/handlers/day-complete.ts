import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../lib/auth";


type Body = {
  trialDay?: number;
  watchedVideo?: boolean;
  completedWorkout?: boolean;
  loggedNutrition?: boolean;
  reviewedNotes?: boolean;
  // Six daily recovery metrics, each 1-5. energyRating is the original column;
  // the other five are added by backend/sql/12_trial_daily_metrics.sql.
  energyRating?: number;
  moodRating?: number;
  libidoRating?: number;
  performanceRating?: number;
  sleepRating?: number;
  rhrRating?: number;
  difficultyRating?: number;
  overallFeeling?: "great" | "good" | "okay" | "tough" | "rough";
  feedbackText?: string;
};

const FEELING_VALUES = new Set(["great", "good", "okay", "tough", "rough"]);
// Postgres code returned when a referenced table doesn't exist — happens on
// projects that haven't run backend/sql/05_trial_completions_activity.sql yet.
const PG_TABLE_MISSING = "42P01";
// Postgres code for "column does not exist" — happens when the daily-metric
// columns haven't been added yet (run backend/sql/12_trial_daily_metrics.sql).
const PG_UNDEFINED_COLUMN = "42703";

function clampDay(n: unknown) {
  const d = Math.round(Number(n));
  if (!Number.isFinite(d)) return null;
  return Math.min(Math.max(d, 1), 7);
}

function clampStar(n: unknown) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return null;
  return Math.min(Math.max(v, 1), 5);
}

/**
 * POST /api/day-complete
 *
 * Records the user's end-of-day checklist + feedback for a single trial day.
 * On Day 7 also marks the trial complete and opens the 48-hour priority
 * enrollment window.
 *
 * Idempotent on (user_id, trial_day) — re-submission overwrites the row so
 * users can edit a same-day mistake before midnight.
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { appUser } = await getAuthenticatedUser(req);

    if (!appUser.trial_start_date) {
      return Response.json(
        {
          error:
            "Your trial isn't active yet. If you just completed payment, give it a moment and refresh.",
        },
        { status: 403 },
      );
    }

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const trialDay = clampDay(body.trialDay);
    if (trialDay === null) {
      return Response.json(
        { error: "trialDay is required (1-7)" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    // Server-enforced sequential gating: a day can only be completed once the
    // previous day is done. This is what makes the unlock real — the next day's
    // content is gated on this row existing, and the client can't skip ahead.
    // Re-editing an already-completed day is always allowed.
    if (trialDay > 1) {
      const { data: priorRows, error: priorErr } = await supabase
        .from("day_completions")
        .select("trial_day")
        .eq("user_id", appUser.id)
        .in("trial_day", [trialDay - 1, trialDay]);
      // A missing table (code 42P01) means the schema isn't migrated yet — let
      // the upsert below surface the clear migration error. Any OTHER lookup
      // failure is transient, so fail CLOSED (never let the user skip the gate
      // because a read happened to error out).
      if (priorErr) {
        if (priorErr.code !== "42P01") {
          return Response.json(
            {
              error:
                "Couldn't verify your progress right now — please try again in a moment.",
            },
            { status: 503 },
          );
        }
      } else {
        const doneDays = new Set(
          (priorRows || []).map((r) => Number(r.trial_day)),
        );
        if (!doneDays.has(trialDay - 1) && !doneDays.has(trialDay)) {
          return Response.json(
            {
              error: `Complete Day ${trialDay - 1} first to unlock Day ${trialDay}.`,
              code: "DAY_LOCKED",
            },
            { status: 403 },
          );
        }
      }
    }

    const feeling =
      body.overallFeeling && FEELING_VALUES.has(body.overallFeeling)
        ? body.overallFeeling
        : null;

    const { data, error } = await supabase
      .from("day_completions")
      .upsert(
        {
          user_id: appUser.id,
          trial_day: trialDay,
          watched_video: !!body.watchedVideo,
          completed_workout: !!body.completedWorkout,
          logged_nutrition: !!body.loggedNutrition,
          reviewed_notes: !!body.reviewedNotes,
          energy_rating: clampStar(body.energyRating),
          mood_rating: clampStar(body.moodRating),
          libido_rating: clampStar(body.libidoRating),
          performance_rating: clampStar(body.performanceRating),
          sleep_rating: clampStar(body.sleepRating),
          rhr_rating: clampStar(body.rhrRating),
          difficulty_rating: clampStar(body.difficultyRating),
          overall_feeling: feeling,
          feedback_text: body.feedbackText?.trim() || null,
          // re-submission of the same day means Ron should re-review
          ron_viewed: false,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,trial_day" },
      )
      .select("*")
      .single();

    if (error) {
      // Schema not migrated — return an actionable 503 so the frontend can
      // surface a clear "ask the admin to run the migration" toast rather
      // than a generic 500.
      if (error.code === PG_TABLE_MISSING) {
        console.warn(
          "[day-complete] day_completions table missing — run backend/sql/05_trial_completions_activity.sql in Supabase.",
        );
        return Response.json(
          {
            error:
              "Database not fully set up. Run backend/sql/05_trial_completions_activity.sql in Supabase to enable daily check-ins.",
            code: "SCHEMA_MIGRATION_REQUIRED",
          },
          { status: 503 },
        );
      }
      if (error.code === PG_UNDEFINED_COLUMN) {
        console.warn(
          "[day-complete] daily-metric columns missing — run backend/sql/12_trial_daily_metrics.sql in Supabase.",
        );
        return Response.json(
          {
            error:
              "Daily-metrics columns aren't set up yet. Run backend/sql/12_trial_daily_metrics.sql in Supabase to enable the check-in form.",
            code: "SCHEMA_MIGRATION_REQUIRED",
          },
          { status: 503 },
        );
      }
      console.error("[day-complete] upsert failed:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Activity log — fire and forget (table may not exist on un-migrated
    // projects, but the user's submit must succeed regardless).
    const swallow = (err: unknown) =>
      console.warn(
        "[day-complete] activity log skipped:",
        err instanceof Error ? err.message : err,
      );
    void Promise.resolve(
      supabase.from("user_activity_log").insert({
        user_id: appUser.id,
        activity_type: "day_completed",
        metadata: {
          day: trialDay,
          has_feedback: !!body.feedbackText?.trim(),
          feeling,
        },
      }),
    )
      .then((r) => {
        if (r.error) swallow(r.error);
      })
      .catch(swallow);
    if (body.feedbackText?.trim()) {
      void Promise.resolve(
        supabase.from("user_activity_log").insert({
          user_id: appUser.id,
          activity_type: "feedback_submitted",
          metadata: { day: trialDay, length: body.feedbackText.trim().length },
        }),
      )
        .then((r) => {
          if (r.error) swallow(r.error);
        })
        .catch(swallow);
    }

    // Day 7 → trial complete + 48-hour priority window.
    let trialComplete = false;
    if (trialDay === 7) {
      const now = new Date();
      const priorityExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const { error: userErr } = await supabase
        .from("users")
        .update({
          trial_completed_at: now.toISOString(),
          priority_window_expires_at: priorityExpiry.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", appUser.id);
      if (userErr) {
        console.error("[day-complete] users update failed:", userErr.message);
      } else {
        trialComplete = true;
      }
    }

    return Response.json({
      success: true,
      completion: data,
      trialComplete,
    });
  } catch (error) {
    return jsonError(error);
  }
}
