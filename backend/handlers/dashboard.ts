import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../lib/auth";
import { getDashboardAccess } from "../lib/dashboardAccess";


function clampDay(day: number) {
  return Math.max(1, Math.min(7, day));
}

function currentTrialDay(trialStartDate?: string | null) {
  if (!trialStartDate) return null;
  const start = new Date(trialStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const elapsed = Math.floor(
    (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return clampDay(elapsed + 1);
}

function fallbackModules() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    return {
      id: `fallback-day-${day}`,
      slug: `trial-day-${day}`,
      title: `Day ${day} Oversight Protocol`,
      description:
        "Complete the daily lesson, log your recovery, and follow the assigned workout.",
      video_url: "",
      trial_day: day,
      duration_minutes: 20,
      key_takeaways: [
        "Watch the lesson",
        "Log recovery metrics",
        "Complete the workout",
      ],
      workout_links: [],
    };
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { appUser } = await getAuthenticatedUser(req);
    const db = createServerSupabase();
    const access = getDashboardAccess(appUser);

    if (!access.allowed) {
      return Response.json(
        { error: access.reason || "Dashboard locked" },
        { status: 403 },
      );
    }
    const activeDay = currentTrialDay(appUser.trial_start_date);

    const { data: modules, error: moduleError } = await db
      .from("training_modules")
      .select("*")
      .eq("active", true)
      .order("trial_day", { ascending: true });

    if (moduleError) {
      console.error("[dashboard] Failed to fetch modules:", moduleError);
    }

    const { data: metrics, error: metricsError } = await db
      .from("recovery_metrics")
      .select("*")
      .eq("user_id", appUser.id)
      .order("metric_date", { ascending: false })
      .limit(14);

    if (metricsError) {
      console.error("[dashboard] Failed to fetch metrics:", metricsError);
    }

    return Response.json({
      user: {
        id: appUser.id,
        email: appUser.email,
        name: appUser.name,
        paymentStatus: appUser.payment_status || null,
        programType: appUser.program_type || null,
        hasBookedCalendly: !!appUser.has_booked_calendly,
        bookingCompleted: access.bookingCompleted,
        bookingTime: access.bookingTime,
        trialStartDate: appUser.trial_start_date,
        trialEndDate: appUser.trial_end_date,
        trialCompletedAt: appUser.trial_completed_at,
        priorityWindowExpiresAt: appUser.priority_window_expires_at,
        convertedToPaid: !!appUser.converted_to_paid,
      },
      locked: !access.allowed,
      dashboardAccess: access,
      activeDay,
      modules: modules?.length ? modules : fallbackModules(),
      metrics: metrics || [],
    });
  } catch (error) {
    return jsonError(error);
  }
}
