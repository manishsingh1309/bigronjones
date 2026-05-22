import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireSuperAdmin } from "../lib/adminAuth";


type FeedbackRow = {
  id: string;
  user_id: string;
  day_number: number;
  mood: number;
  energy: number;
  understanding_level: number;
  takeaway: string | null;
  struggles: string | null;
  questions: string | null;
  commitment_score: number;
  notes: string | null;
  created_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  } | null;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const auth = await requireSuperAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServerSupabase();
  const now = Date.now();
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    paidUsers,
    superAdmins,
    completedTrials,
    unlockedDayRows,
    feedbackCount,
    feedbackRecent,
    feedbackDayRows,
    progressRows,
    recentUsers,
    coachNotes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .is("trial_completed_at", null)
      .eq("payment_status", "paid"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .not("trial_completed_at", "is", null),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "paid"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .not("trial_completed_at", "is", null),
    supabase
      .from("user_video_progress")
      .select("id", { count: "exact", head: true })
      .eq("unlocked", true),
    supabase
      .from("daily_feedback")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("daily_feedback")
      .select(
        "id, user_id, day_number, mood, energy, understanding_level, takeaway, struggles, questions, commitment_score, notes, created_at, users!inner(id, name, email, role)",
      )
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("daily_feedback")
      .select(
        "day_number, mood, energy, understanding_level, commitment_score, created_at",
      )
      .gte("created_at", last30d)
      .order("created_at", { ascending: true }),
    supabase
      .from("user_video_progress")
      .select(
        "user_id, day_number, watched, completed, unlocked, completed_at, watched_at, unlocked_at",
      )
      .gte("updated_at", last7d)
      .order("day_number", { ascending: true }),
    supabase
      .from("users")
      .select(
        "id, name, email, role, payment_status, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, converted_to_paid, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("coach_notes")
      .select("id, user_id, admin_id, note, label, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const feedbackRows = (feedbackRecent.data || []) as FeedbackRow[];
  const feedbackTrend = Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    const entries = (feedbackDayRows.data || []).filter(
      (row) => row.day_number === day,
    );
    const avg = (field: keyof (typeof entries)[number]) => {
      if (!entries.length) return 0;
      return Number(
        (
          entries.reduce((sum, row) => sum + Number(row[field] || 0), 0) /
          entries.length
        ).toFixed(1),
      );
    };
    return {
      day,
      mood: avg("mood"),
      energy: avg("energy"),
      understandingLevel: avg("understanding_level"),
      commitmentScore: avg("commitment_score"),
    };
  });

  const progressTrend = Array.from({ length: 7 }, (_, index) => {
    const day = index + 1;
    const entries = (progressRows.data || []).filter(
      (row) => row.day_number === day,
    );
    return {
      day,
      watched: entries.filter((row) => row.watched).length,
      completed: entries.filter((row) => row.completed).length,
      unlocked: entries.filter((row) => row.unlocked).length,
    };
  });

  return Response.json({
    stats: {
      totalUsers: totalUsers.count || 0,
      activeUsers: activeUsers.count || 0,
      inactiveUsers: inactiveUsers.count || 0,
      paidUsers: paidUsers.count || 0,
      superAdmins: superAdmins.count || 0,
      completedTrials: completedTrials.count || 0,
      unlockedDayRows: unlockedDayRows.count || 0,
      feedbackCount: feedbackCount.count || 0,
      feedbackRecent7d: (feedbackDayRows.data || []).filter(
        (row) =>
          new Date(row.created_at).getTime() >= now - 7 * 24 * 60 * 60 * 1000,
      ).length,
    },
    recentUsers: recentUsers.data || [],
    recentFeedback: feedbackRows,
    feedbackTrend,
    progressTrend,
    coachNotes: coachNotes.data || [],
  });
}
