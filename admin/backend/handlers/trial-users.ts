// /api/admin/trial-users
//
// GET                  → list every trial user (filter + search). Soft-deleted
//                        rows are excluded unless ?include_deleted=1.
// GET ?id=<uuid>       → single-user detail with metrics, completions, activity.
// DELETE Body: { id }  → soft-delete (sets users.deleted_at = now()).
//                        We never hard-delete users — completions/orders
//                        reference them and the audit trail must survive.
//
// The deleted_at column is added by 10_soft_delete_users.sql / MIGRATE.sql.
// If the column is missing, DELETE returns a clear error.
import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireAdmin } from "../lib/adminAuth";


type UserRow = {
  id: string;
  email: string;
  name: string;
  program_type: string | null;
  payment_status: string | null;
  has_booked_calendly: boolean | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_completed_at: string | null;
  priority_window_expires_at: string | null;
  converted_to_paid: boolean | null;
  created_at: string;
};

function trialDay(start?: string | null) {
  if (!start) return null;
  const elapsed = Math.floor(
    (Date.now() - new Date(start).getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, Math.min(7, elapsed + 1));
}

function status(u: UserRow): string {
  if (u.converted_to_paid) return "converted";
  if (u.trial_completed_at) return "completed";
  if (u.has_booked_calendly && u.trial_start_date) return "active";
  if (u.payment_status === "paid") return "awaiting_calendly";
  return "lead";
}

export default async function handler(req: Request): Promise<Response> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = createServerSupabase();

  // ── DELETE — soft-delete a single user ──────────────────────────────────
  if (req.method === "DELETE") {
    let body: { id?: string };
    try {
      body = (await req.json()) as { id?: string };
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const id = body.id ? String(body.id) : null;
    if (!id) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("users")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, deleted_at")
      .maybeSingle();

    if (error) {
      // Most likely cause: deleted_at column is missing. Surface the
      // migration instruction explicitly so the admin knows what to run.
      const missingCol = /deleted_at|column .* does not exist/i.test(
        error.message,
      );
      return Response.json(
        {
          error: missingCol
            ? "User soft-delete requires the deleted_at column. Run backend/sql/10_soft_delete_users.sql in Supabase."
            : error.message,
        },
        { status: missingCol ? 501 : 500 },
      );
    }
    if (!data) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    return Response.json({ ok: true, id: data.id });
  }

  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const includeDeleted = url.searchParams.get("include_deleted") === "1";

  // ── Single user detail mode ────────────────────────────────────────────
  if (id) {
    const [
      { data: user, error: userErr },
      { data: completions },
      { data: metrics },
      { data: activity },
    ] = await Promise.all([
      supabase
        .from("users")
        .select(
          "id, email, name, program_type, payment_status, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, priority_window_expires_at, converted_to_paid, created_at, stripe_session_id, calendly_event_id",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("day_completions")
        .select("*")
        .eq("user_id", id)
        .order("trial_day", { ascending: true }),
      supabase
        .from("recovery_metrics")
        .select("*")
        .eq("user_id", id)
        .order("metric_date", { ascending: true }),
      supabase
        .from("user_activity_log")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (userErr) {
      return Response.json({ error: userErr.message }, { status: 500 });
    }
    if (!user) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({
      user: {
        ...user,
        status: status(user as UserRow),
        trialDay: trialDay(user.trial_start_date),
      },
      completions: completions || [],
      metrics: metrics || [],
      activity: activity || [],
    });
  }

  // ── List mode ──────────────────────────────────────────────────────────
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const filter = url.searchParams.get("status") || "";

  let query = supabase
    .from("users")
    .select(
      "id, email, name, program_type, payment_status, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, priority_window_expires_at, converted_to_paid, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }
  if (search) {
    const safe = search.replace(/[%_]/g, "\\$&");
    query = query.or(`email.ilike.%${safe}%,name.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) {
    // Older databases without the deleted_at column would fall through with
    // a column-missing error here. Retry once without the filter so the page
    // still renders, and the admin sees the soft-delete failure only when
    // they try to delete (which has a clearer message).
    if (
      !includeDeleted &&
      /deleted_at|column .* does not exist/i.test(error.message)
    ) {
      const { data: fallback, error: fallbackErr } = await supabase
        .from("users")
        .select(
          "id, email, name, program_type, payment_status, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, priority_window_expires_at, converted_to_paid, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (fallbackErr) {
        return Response.json({ error: fallbackErr.message }, { status: 500 });
      }
      let users = (fallback || []).map((u) => ({
        ...u,
        status: status(u as UserRow),
        trialDay: trialDay(u.trial_start_date),
      }));
      if (filter) users = users.filter((u) => u.status === filter);
      const counts = users.reduce<Record<string, number>>((acc, u) => {
        acc[u.status] = (acc[u.status] || 0) + 1;
        return acc;
      }, {});
      return Response.json({ users, counts, total: users.length });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  let users = (data || []).map((u) => ({
    ...u,
    status: status(u as UserRow),
    trialDay: trialDay(u.trial_start_date),
  }));
  if (filter) users = users.filter((u) => u.status === filter);

  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {});

  return Response.json({ users, counts, total: users.length });
}
