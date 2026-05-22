// GET /api/admin/trial-stats
//
// Powers the admin trial dashboard overview cards + activity feed +
// preview of recent unread feedback. Single round-trip so the page
// renders fast with no waterfall.
import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireAdmin } from "../lib/adminAuth";


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServerSupabase();
  const now = Date.now();
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  // Soft-deleted users are filtered out of every count. If the migration
  // hasn't been run the .is("deleted_at", ...) calls will return an error
  // result; we treat that as 0 rather than throwing, so the dashboard still
  // renders (admin sees a clearer error only when they try to delete).

  // Independent counts run in parallel.
  const [
    totalUsers,
    paidUsers,
    activeTrials,
    completedTrials,
    purchasedLast7d,
    completionsTotal,
    feedbackPending,
    feedbackLast24h,
    recentActivity,
    recentFeedback,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid")
      .is("deleted_at", null),
    // "Active" = booked Calendly + trial started + not yet completed
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("has_booked_calendly", true)
      .not("trial_start_date", "is", null)
      .is("trial_completed_at", null)
      .is("deleted_at", null),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .not("trial_completed_at", "is", null)
      .is("deleted_at", null),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", last7d)
      .is("deleted_at", null),
    supabase
      .from("day_completions")
      .select("id", { count: "exact", head: true }),
    // Unread feedback (real text from a user, not yet viewed by Ron)
    supabase
      .from("day_completions")
      .select("id", { count: "exact", head: true })
      .eq("ron_viewed", false)
      .not("feedback_text", "is", null),
    supabase
      .from("day_completions")
      .select("id", { count: "exact", head: true })
      .gte("completed_at", last24h)
      .not("feedback_text", "is", null),
    supabase
      .from("user_activity_log")
      .select("id, activity_type, metadata, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(15),
    // 5 most recent unread feedback items, joined with user info
    supabase
      .from("day_completions")
      .select(
        "id, trial_day, overall_feeling, energy_rating, difficulty_rating, feedback_text, completed_at, ron_viewed, ron_reply, user_id, users!inner(id, name, email)",
      )
      .not("feedback_text", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
  ]);

  // Hydrate activity rows with the user's email/name in a single follow-up.
  const userIds = Array.from(
    new Set(
      (recentActivity.data || []).map((r: { user_id: string }) => r.user_id),
    ),
  );
  let userMap: Record<string, { name: string; email: string }> = {};
  if (userIds.length > 0) {
    const { data: usrRows } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    userMap = Object.fromEntries(
      (usrRows || []).map((u: { id: string; name: string; email: string }) => [
        u.id,
        { name: u.name, email: u.email },
      ]),
    );
  }
  const activityHydrated = (recentActivity.data || []).map(
    (a: {
      id: string;
      activity_type: string;
      metadata: unknown;
      created_at: string;
      user_id: string;
    }) => ({
      ...a,
      user: userMap[a.user_id] || null,
    }),
  );

  return Response.json({
    stats: {
      totalUsers: totalUsers.count || 0,
      paidUsers: paidUsers.count || 0,
      activeTrials: activeTrials.count || 0,
      completedTrials: completedTrials.count || 0,
      purchasedLast7d: purchasedLast7d.count || 0,
      completionsTotal: completionsTotal.count || 0,
      feedbackPending: feedbackPending.count || 0,
      feedbackLast24h: feedbackLast24h.count || 0,
    },
    recentActivity: activityHydrated,
    recentFeedback: recentFeedback.data || [],
  });
}
