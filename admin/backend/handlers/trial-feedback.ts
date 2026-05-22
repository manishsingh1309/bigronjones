// /api/admin/trial-feedback
//
// GET    ?status=unread|replied|unreplied|all
//        ?limit=50  ?offset=0
//
// DELETE Body: { id } or { ids: [...] }
//        Hides the message from Ron's inbox by clearing feedback_text on the
//        day_completion row. We do NOT delete the row itself — the user's
//        progress (workout, video, nutrition flags) lives on the same row
//        and must be preserved for the dashboard timeline.
//        Bulk cap is 200 ids per request.
import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireAdmin } from "../lib/adminAuth";


const BULK_LIMIT = 200;

export default async function handler(req: Request): Promise<Response> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = createServerSupabase();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const filter = url.searchParams.get("status") || "all";
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

    let q = supabase
      .from("day_completions")
      .select(
        "id, user_id, trial_day, overall_feeling, energy_rating, difficulty_rating, feedback_text, completed_at, ron_viewed, ron_reply, ron_replied_at, users!inner(id, name, email, program_type)",
        { count: "exact" },
      )
      .not("feedback_text", "is", null)
      .order("completed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter === "unread") q = q.eq("ron_viewed", false);
    if (filter === "replied") q = q.not("ron_reply", "is", null);
    if (filter === "unreplied") q = q.is("ron_reply", null);

    const { data, error, count } = await q;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({
      feedback: data || [],
      total: count || 0,
      limit,
      offset,
      filter,
    });
  }

  if (req.method === "DELETE") {
    let body: { id?: string; ids?: unknown };
    try {
      body = (await req.json()) as { id?: string; ids?: unknown };
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.filter(
          (x): x is string => typeof x === "string" && x.length > 0,
        )
      : body.id
        ? [String(body.id)]
        : [];

    if (ids.length === 0) {
      return Response.json({ error: "No ids provided" }, { status: 400 });
    }
    if (ids.length > BULK_LIMIT) {
      return Response.json(
        { error: `Bulk delete capped at ${BULK_LIMIT} per request` },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("day_completions")
      .update({
        feedback_text: null,
        ron_viewed: true,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .select("id");

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, deleted: (data || []).length });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
