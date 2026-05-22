import { createServerSupabase } from "../../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../../lib/auth";
import { getDashboardAccess } from "../../lib/dashboardAccess";
import {
  buildCoachingDashboardState,
  defaultVideoModules,
  type DailyFeedback,
  type UserVideoProgress,
  type VideoModule,
} from "../../lib/coachingProgress";


function clamp(value: unknown, min = 1, max = 10) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(min, Math.min(max, Math.round(number)));
}

async function loadState(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
) {
  const [modules, progressRows, feedbackRows] = await Promise.all([
    supabase
      .from("video_modules")
      .select("*")
      .order("day_number", { ascending: true }),
    supabase
      .from("user_video_progress")
      .select("*")
      .eq("user_id", userId)
      .order("day_number", { ascending: true }),
    supabase
      .from("daily_feedback")
      .select("*")
      .eq("user_id", userId)
      .order("day_number", { ascending: true }),
  ]);

  return buildCoachingDashboardState({
    modules: (modules.data as VideoModule[] | null)?.length
      ? (modules.data as VideoModule[])
      : defaultVideoModules(),
    progressRows: (progressRows.data as UserVideoProgress[] | null) || [],
    feedbackRows: (feedbackRows.data as DailyFeedback[] | null) || [],
  });
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const { appUser } = await getAuthenticatedUser(req);
    const access = getDashboardAccess(appUser);
    if (!access.allowed) {
      return Response.json(
        { error: access.reason || "Dashboard locked" },
        { status: 403 },
      );
    }

    const supabase = createServerSupabase();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("daily_feedback")
        .select("*")
        .eq("user_id", appUser.id)
        .order("day_number", { ascending: true });

      if (error) {
        return Response.json({ feedback: [] });
      }

      return Response.json({ feedback: data || [] });
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = (await req.json()) as {
      dayNumber?: number;
      mood?: number;
      energy?: number;
      understandingLevel?: number;
      takeaway?: string;
      struggles?: string;
      questions?: string;
      commitmentScore?: number;
      notes?: string;
    };
    const dayNumber = Math.max(1, Math.min(7, Number(body.dayNumber || 1)));
    const state = await loadState(supabase, appUser.id);
    const dayState = state.modules.find(
      (module) => module.day_number === dayNumber,
    );

    if (!dayState?.completed) {
      return Response.json(
        { error: "Complete the video before submitting feedback" },
        { status: 400 },
      );
    }

    const payload = {
      user_id: appUser.id,
      day_number: dayNumber,
      mood: clamp(body.mood),
      energy: clamp(body.energy),
      understanding_level: clamp(body.understandingLevel),
      takeaway: body.takeaway?.trim() || null,
      struggles: body.struggles?.trim() || null,
      questions: body.questions?.trim() || null,
      commitment_score: clamp(body.commitmentScore),
      notes: body.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (
      payload.mood === null ||
      payload.energy === null ||
      payload.understanding_level === null ||
      payload.commitment_score === null
    ) {
      return Response.json(
        { error: "All scoring fields are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("daily_feedback")
      .upsert(payload, { onConflict: "user_id,day_number" })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (dayNumber < 7) {
      await supabase
        .from("user_video_progress")
        .upsert(
          {
            user_id: appUser.id,
            day_number: dayNumber + 1,
            unlocked: true,
            unlocked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,day_number" },
        )
        .then(() => undefined);
    } else {
      await supabase
        .from("users")
        .update({
          trial_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", appUser.id)
        .then(() => undefined);
    }

    const nextState = await loadState(supabase, appUser.id);
    return Response.json({
      success: true,
      feedback: data,
      modules: nextState.modules,
      currentDay: nextState.currentDay,
      completionPercent: nextState.completionPercent,
    });
  } catch (error) {
    return jsonError(error);
  }
}
