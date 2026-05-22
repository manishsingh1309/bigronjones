// GET /api/admin/stats
//
// Single endpoint that powers the admin dashboard overview cards.
// Returns: totalContent, activeContent, totalLeads, leadsLast7d,
//          totalViews, recentLeads (5).
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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Run independent counts in parallel.
  const [
    contentCounts,
    leadTotal,
    leadsRecent7d,
    viewSum,
    recentLeads,
  ] = await Promise.all([
    supabase
      .from("lead_magnets")
      .select("active", { count: "exact", head: false }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("lead_magnets").select("view_count, download_count"),
    supabase
      .from("leads")
      .select(
        "id, full_name, email, lead_magnet_slug, created_at, lead_magnets(title)"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalContent = contentCounts.count || 0;
  const activeContent = (contentCounts.data || []).filter(
    (r: { active: boolean }) => r.active
  ).length;
  const totalLeads = leadTotal.count || 0;
  const leadsLast7d = leadsRecent7d.count || 0;
  const totalViews = (viewSum.data || []).reduce(
    (sum: number, r: { view_count: number | null }) => sum + (r.view_count || 0),
    0
  );
  const totalDownloads = (viewSum.data || []).reduce(
    (sum: number, r: { download_count: number | null }) =>
      sum + (r.download_count || 0),
    0
  );

  return Response.json({
    totalContent,
    activeContent,
    totalLeads,
    leadsLast7d,
    totalViews,
    totalDownloads,
    recentLeads: recentLeads.data || [],
  });
}
