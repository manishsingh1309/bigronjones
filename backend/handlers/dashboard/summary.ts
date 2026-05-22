import { createServerSupabase } from "../../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../../lib/auth";
import { getDashboardAccess } from "../../lib/dashboardAccess";
import {
  premiumDashboardMock,
  type PremiumDashboardSummary,
} from "../../lib/premium-dashboard";
import {
  buildCoachingDashboardState,
  defaultVideoModules,
  type DailyFeedback,
  type UserVideoProgress,
  type VideoModule,
} from "../../lib/coachingProgress";


async function maybeLoadTable<T>(
  query: () => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[] | null> {
  try {
    const { data, error } = await query();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

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

    const checkIns = await maybeLoadTable(() =>
      supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", appUser.id)
        .order("created_at", { ascending: false })
        .limit(30),
    );

    const workouts = await maybeLoadTable(() =>
      supabase
        .from("workouts")
        .select("*")
        .eq("user_id", appUser.id)
        .order("day", { ascending: true }),
    );

    const emailProgress = await maybeLoadTable(() =>
      supabase
        .from("email_progress")
        .select("*")
        .eq("user_id", appUser.id)
        .order("step", { ascending: true }),
    );

    const analytics = await maybeLoadTable(() =>
      supabase
        .from("dashboard_analytics")
        .select("*")
        .eq("user_id", appUser.id)
        .limit(1),
    );

    const videoModules = await maybeLoadTable(() =>
      supabase
        .from("video_modules")
        .select("*")
        .order("day_number", { ascending: true }),
    );
    const userProgress = await maybeLoadTable(() =>
      supabase
        .from("user_video_progress")
        .select("*")
        .eq("user_id", appUser.id)
        .order("day_number", { ascending: true }),
    );
    const dailyFeedback = await maybeLoadTable(() =>
      supabase
        .from("daily_feedback")
        .select("*")
        .eq("user_id", appUser.id)
        .order("day_number", { ascending: true }),
    );
    const coachNotes = await maybeLoadTable(() =>
      supabase
        .from("coach_notes")
        .select("*")
        .eq("user_id", appUser.id)
        .order("created_at", { ascending: false })
        .limit(20),
    );

    const coachingState = buildCoachingDashboardState({
      modules: (videoModules as VideoModule[] | null)?.length
        ? (videoModules as VideoModule[])
        : defaultVideoModules(),
      progressRows: (userProgress as UserVideoProgress[] | null) || [],
      feedbackRows: (dailyFeedback as DailyFeedback[] | null) || [],
    });

    const feedbackByDay = new Map(
      ((dailyFeedback as DailyFeedback[] | null) || []).map((item) => [
        item.day_number,
        item,
      ]),
    );
    const analyticsFromFeedback = coachingState.modules.length
      ? {
          labels: coachingState.modules.map(
            (module) => `Day ${module.day_number}`,
          ),
          energy: coachingState.modules.map(
            (module) => feedbackByDay.get(module.day_number)?.energy || 0,
          ),
          mood: coachingState.modules.map(
            (module) => feedbackByDay.get(module.day_number)?.mood || 0,
          ),
          performance: coachingState.modules.map(
            (module) =>
              feedbackByDay.get(module.day_number)?.commitment_score || 0,
          ),
          checkInConsistency: coachingState.modules.map(
            (_, index) =>
              coachingState.completedDays.filter((day) => day <= index + 1)
                .length,
          ),
          weight: coachingState.modules.map(() => null),
        }
      : premiumDashboardMock.analytics;

    const summary: PremiumDashboardSummary = {
      ...premiumDashboardMock,
      user: {
        ...premiumDashboardMock.user,
        id: appUser.id,
        email: appUser.email,
        name: appUser.name,
        paymentStatus:
          (appUser.payment_status as "pending" | "paid" | "refunded") ||
          "pending",
        bookingCompleted: access.bookingCompleted,
        bookingTime: access.bookingTime,
        trialStartDate: appUser.trial_start_date,
        trialEndDate: appUser.trial_end_date,
        trialCompletedAt: appUser.trial_completed_at,
        role: (appUser.role as "user" | "admin" | "super_admin") || "user",
        streakDays: coachingState.currentDay,
        progressPercent: coachingState.completionPercent,
      },
      modules: coachingState.modules,
      activeDay: coachingState.currentDay,
      currentDay: coachingState.currentDay,
      completedDays: coachingState.completedDays,
      watchedVideos: coachingState.watchedVideos,
      unlockStatus: coachingState.unlockStatus,
      dailyFeedback: (dailyFeedback as DailyFeedback[] | null) || [],
      coachNotes:
        (coachNotes as
          | {
              id: string;
              user_id: string;
              admin_id: string;
              note: string;
              label?: string;
              created_at: string;
            }[]
          | null) || [],
      completionPercent: coachingState.completionPercent,
      checkIns: checkIns || premiumDashboardMock.checkIns,
      workouts: workouts || premiumDashboardMock.workouts,
      emailProgress: emailProgress || premiumDashboardMock.emailProgress,
      analytics: analytics?.length
        ? analyticsFromFeedback
        : premiumDashboardMock.analytics,
      discoveryCall: {
        ...premiumDashboardMock.discoveryCall,
        booked: access.bookingCompleted,
        scheduledAt: access.bookingTime,
      },
    };

    return Response.json({ summary, access });
  } catch (error) {
    return jsonError(error);
  }
}
