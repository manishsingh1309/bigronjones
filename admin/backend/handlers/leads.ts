// /api/admin/leads
//
// GET    → list with optional filter/search/pagination
//   ?content_id=<uuid>   filter by lead_magnet
//   ?q=<string>          case-insensitive search across name / email / phone
//   ?limit=50            default 100, max 500
//   ?offset=0
//
// DELETE → remove one or many leads. Body: { id } or { ids: [..] }.
//   Bulk cap is 200 ids per request.
//
// Leads are simple capture rows — safe to hard-delete (no orders or
// payments hang off them). User soft-delete is handled separately.
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
    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("content_id");
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    let query = supabase
      .from("leads")
      .select(
        "id, full_name, email, phone, lead_magnet_id, lead_magnet_slug, source, utm_source, utm_campaign, status, pdf_sent, pdf_sent_at, created_at, lead_magnets(title, type)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (contentId) query = query.eq("lead_magnet_id", contentId);
    if (q) {
      // Escape % and _ to avoid the user accidentally turning their query
      // into a wildcard search.
      const safe = q.replace(/[%_]/g, "\\$&");
      query = query.or(
        `full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`,
      );
    }

    const { data, error, count } = await query;
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({
      items: data || [],
      total: count || 0,
      limit,
      offset,
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
      ? body.ids.filter((x): x is string => typeof x === "string" && x.length > 0)
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

    const { error, count } = await supabase
      .from("leads")
      .delete({ count: "exact" })
      .in("id", ids);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true, deleted: count || 0 });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
