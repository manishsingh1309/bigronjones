// GET /api/lead-magnet?slug=mass-gain-guide
// Public endpoint — used by the landing page to fetch hero copy, content
// type and the delivery URL hint. Also bumps view_count.
import { createServerSupabase } from "../lib/supabase";


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return Response.json({ error: "Missing slug" }, { status: 400 });
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("lead_magnets")
      .select(
        "id, slug, title, description, type, pdf_url, external_url, cta_text, cover_image_url, category, download_count, view_count"
      )
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (error || !data) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Best-effort view counter. Don't fail the request if it errors.
    void supabase
      .from("lead_magnets")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", data.id)
      .then(({ error: bumpErr }) => {
        if (bumpErr) console.error("[lead-magnet] view bump failed:", bumpErr.message);
      });

    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[lead-magnet] error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
