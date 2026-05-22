// POST /api/admin/trial-reply  { completionId, reply, markRead? }
//
// Ron's reply to a single day_completion's feedback. Stores the reply,
// stamps ron_replied_at, marks the row as viewed, and logs an
// `admin_replied` activity entry so the user's activity feed reflects it.
//
// PATCH /api/admin/trial-reply  { completionId, viewed: true }
//   Marks a feedback row as read without sending a reply.
import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireAdmin } from "../lib/adminAuth";


type Body = {
  completionId?: string;
  reply?: string;
  viewed?: boolean;
  markRead?: boolean;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST" && req.method !== "PATCH") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.completionId) {
    return Response.json({ error: "completionId is required" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  if (req.method === "PATCH" || (req.method === "POST" && body.viewed && !body.reply)) {
    const { error } = await supabase
      .from("day_completions")
      .update({ ron_viewed: true, updated_at: new Date().toISOString() })
      .eq("id", body.completionId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true, marked: "viewed" });
  }

  const reply = (body.reply || "").trim();
  if (!reply) {
    return Response.json({ error: "reply is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("day_completions")
    .update({
      ron_reply: reply,
      ron_replied_at: new Date().toISOString(),
      ron_viewed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.completionId)
    .select("id, user_id, trial_day")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Activity log so the user's own activity feed reflects Ron's response.
  await supabase
    .from("user_activity_log")
    .insert({
      user_id: data.user_id,
      activity_type: "admin_replied",
      metadata: { day: data.trial_day, completion_id: data.id },
    })
    .then(() => undefined);

  return Response.json({ success: true, completion: data });
}
