// User-facing per-day video review.
//
//   POST /api/trial-feedback { trialDay, review }
//   GET  /api/trial-feedback
//
// Writes the review into day_completions.feedback_text — the same row used
// by /api/day-complete, so the admin Trial Feedback inbox at
// /api/admin/trial-feedback picks it up automatically.
//
// A "review" is just feedback_text; we don't require the user to have
// already filled in the rest of the day completion (energy / difficulty /
// workout flags). They're separate UX surfaces.
import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../lib/auth";


type Body = {
  trialDay?: number;
  review?: string;
};

// Surfaced when day_completions table hasn't been created yet — render the
// dashboard cleanly instead of 500ing.
const PG_TABLE_MISSING = "42P01";

export default async function handler(req: Request): Promise<Response> {
  try {
    const { appUser } = await getAuthenticatedUser(req);
    const supabase = createServerSupabase();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("day_completions")
        .select("trial_day, feedback_text, completed_at, updated_at, ron_reply, ron_replied_at")
        .eq("user_id", appUser.id)
        .not("feedback_text", "is", null)
        .order("trial_day", { ascending: true });

      if (error) {
        if (error.code === PG_TABLE_MISSING) return Response.json({ feedback: [] });
        console.error("[trial-feedback] read failed:", error);
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({
        feedback: (data || []).map((row) => ({
          trialDay: row.trial_day,
          review: row.feedback_text,
          createdAt: row.completed_at,
          updatedAt: row.updated_at,
          ronReply: row.ron_reply || null,
          ronRepliedAt: row.ron_replied_at || null,
        })),
      });
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    let body: Body;
    try {
      body = (await req.json()) as Body;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const trialDay = Number(body.trialDay);
    const review = (body.review || "").toString().trim();

    if (!Number.isInteger(trialDay) || trialDay < 1 || trialDay > 7) {
      return Response.json(
        { error: "trialDay must be an integer between 1 and 7" },
        { status: 400 },
      );
    }
    if (!review) {
      return Response.json({ error: "review is required" }, { status: 400 });
    }
    if (review.length > 4000) {
      return Response.json(
        { error: "review must be 4000 characters or fewer" },
        { status: 400 },
      );
    }

    // Upsert on (user_id, trial_day). If the row already exists from a prior
    // day-complete submission we only touch feedback_text — the workout /
    // energy / nutrition flags stay as they were.
    const { data, error } = await supabase
      .from("day_completions")
      .upsert(
        {
          user_id: appUser.id,
          trial_day: trialDay,
          feedback_text: review,
          // Re-submission means Ron should re-read it.
          ron_viewed: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,trial_day" },
      )
      .select("trial_day, feedback_text, completed_at, updated_at")
      .single();

    if (error) {
      if (error.code === PG_TABLE_MISSING) {
        return Response.json(
          {
            error:
              "day_completions table missing — run backend/sql/05_trial_completions_activity.sql in Supabase.",
          },
          { status: 503 },
        );
      }
      console.error("[trial-feedback] write failed:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Activity log so it shows on the admin live feed.
    supabase
      .from("user_activity_log")
      .insert({
        user_id: appUser.id,
        activity_type: "feedback_submitted",
        metadata: { day: trialDay, length: review.length, source: "trial-feedback" },
      })
      .then(() => undefined);

    return Response.json({
      feedback: {
        trialDay: data?.trial_day,
        review: data?.feedback_text,
        createdAt: data?.completed_at,
        updatedAt: data?.updated_at,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
