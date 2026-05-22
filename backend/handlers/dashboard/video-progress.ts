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


function clampDay(value: unknown) {
  const day = Number(value);
  if (!Number.isFinite(day)) return null;
  return Math.max(1, Math.min(7, Math.trunc(day)));
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
      const state = await loadState(supabase, appUser.id);
      return Response.json({
        modules: state.modules,
        currentDay: state.currentDay,
        completionPercent: state.completionPercent,
        completedDays: state.completedDays,
        watchedVideos: state.watchedVideos,
        unlockStatus: state.unlockStatus,
      });
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = (await req.json()) as {
      dayNumber?: number;
      watched?: boolean;
      completed?: boolean;
    };
    const dayNumber = clampDay(body.dayNumber);
    if (!dayNumber) {
      return Response.json({ error: "dayNumber is required" }, { status: 400 });
    }

    const state = await loadState(supabase, appUser.id);
    const currentDay = state.currentDay;
    const existingModule = state.modules.find(
      (module) => module.day_number === dayNumber,
    );
    if (!existingModule) {
      return Response.json({ error: "Module not found" }, { status: 404 });
    }
    if (!existingModule.unlocked && dayNumber > currentDay) {
      return Response.json(
        { error: "Complete the previous day before opening this module" },
        { status: 403 },
      );
    }

    const now = new Date().toISOString();
    const watched = body.watched !== false;
    const completed = body.completed === true;

    if (completed && !watched && !existingModule.watched) {
      return Response.json(
        { error: "Watch the video before marking the day complete" },
        { status: 400 },
      );
    }

    const { data: progress, error } = await supabase
      .from("user_video_progress")
      .upsert(
        {
          user_id: appUser.id,
          day_number: dayNumber,
          watched,
          completed,
          unlocked: true,
          watched_at: watched ? now : null,
          completed_at: completed ? now : null,
          unlocked_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,day_number" },
      )
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { data: feedback } = await supabase
      .from("daily_feedback")
      .select("id")
      .eq("user_id", appUser.id)
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (completed && feedback && dayNumber < 7) {
      await supabase
        .from("user_video_progress")
        .upsert(
          {
            user_id: appUser.id,
            day_number: dayNumber + 1,
            unlocked: true,
            unlocked_at: now,
            updated_at: now,
          },
          { onConflict: "user_id,day_number" },
        )
        .then(() => undefined);
    }

    if (completed && feedback && dayNumber === 7) {
      await supabase
        .from("users")
        .update({
          trial_completed_at: now,
          trial_end_date: now,
          updated_at: now,
        })
        .eq("id", appUser.id)
        .then(() => undefined);
    }

    const nextState = await loadState(supabase, appUser.id);
    return Response.json({
      success: true,
      progress,
      modules: nextState.modules,
      currentDay: nextState.currentDay,
      completionPercent: nextState.completionPercent,
      completedDays: nextState.completedDays,
      watchedVideos: nextState.watchedVideos,
      unlockStatus: nextState.unlockStatus,
    });
  } catch (error) {
    return jsonError(error);
  }
}
