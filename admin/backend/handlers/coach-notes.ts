import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireSuperAdmin } from "../lib/adminAuth";


export default async function handler(req: Request): Promise<Response> {
  const auth = await requireSuperAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServerSupabase();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    let query = supabase
      .from("coach_notes")
      .select("id, user_id, admin_id, note, label, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ notes: data || [] });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: {
    userId?: string;
    note?: string;
    label?: "general" | "high-risk" | "high-potential";
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.userId || !body.note?.trim()) {
    return Response.json(
      { error: "userId and note are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("coach_notes")
    .insert({
      user_id: body.userId,
      admin_id: auth.user.id,
      note: body.note.trim(),
      label: body.label || "general",
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ note: data });
}
