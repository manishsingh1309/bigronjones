// /api/admin/content
//
//   GET    → list all content (active + inactive), newest first
//   POST   → create a new piece of content
//   PUT    → update an existing piece (body must include `id`)
//   DELETE → delete a piece (body must include `id`)
//
// Admin-only. Frontend must send `Authorization: Bearer <supabase token>`.
// All writes go through the service-role client; RLS does not apply.
import { createServerSupabase } from "../../../backend/lib/supabase";
import { requireAdmin } from "../lib/adminAuth";


const VALID_TYPES = ["pdf", "ebook", "youtube", "url", "file"] as const;
type ContentType = (typeof VALID_TYPES)[number];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default async function handler(req: Request): Promise<Response> {
  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }
  const adminUser = auth.user;
  const supabase = createServerSupabase();

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("lead_magnets")
      .select(
        "id, slug, title, description, type, pdf_url, external_url, cta_text, cover_image_url, category, email_subject, active, view_count, download_count, created_at, updated_at"
      )
      .order("created_at", { ascending: false });
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ items: data || [] });
  }

  if (req.method === "POST" || req.method === "PUT") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const type = String(body.type || "pdf") as ContentType;
    const slugInput = String(body.slug || "").trim();
    const slug = slugInput ? slugify(slugInput) : slugify(title);
    const externalUrl = body.external_url ? String(body.external_url).trim() : null;
    const pdfUrl = body.pdf_url ? String(body.pdf_url).trim() : null;
    const coverImageUrl = body.cover_image_url
      ? String(body.cover_image_url).trim()
      : null;
    const ctaText = body.cta_text ? String(body.cta_text).trim() : null;
    const emailSubject = body.email_subject
      ? String(body.email_subject).trim()
      : `Your Free ${title} from BigRonJones`;
    const active = body.active === undefined ? true : Boolean(body.active);

    if (!title || !description) {
      return Response.json(
        { error: "Title and description are required" },
        { status: 422 }
      );
    }
    if (!VALID_TYPES.includes(type)) {
      return Response.json({ error: "Invalid content type" }, { status: 422 });
    }

    const needsFile = type === "pdf" || type === "ebook" || type === "file";
    const needsUrl = type === "youtube" || type === "url";
    if (needsFile && !pdfUrl) {
      return Response.json(
        { error: "Upload a file for this content type" },
        { status: 422 }
      );
    }
    if (needsUrl && !externalUrl) {
      return Response.json(
        { error: "Enter a URL for this content type" },
        { status: 422 }
      );
    }

    if (req.method === "POST") {
      const { data, error } = await supabase
        .from("lead_magnets")
        .insert({
          slug,
          title,
          description,
          type,
          pdf_url: pdfUrl,
          external_url: externalUrl,
          cover_image_url: coverImageUrl,
          cta_text: ctaText,
          email_subject: emailSubject,
          category: body.category ? String(body.category) : "fitness",
          active,
          created_by: adminUser.id,
        })
        .select()
        .single();
      if (error) {
        const msg = error.message.includes("duplicate")
          ? "A piece with this slug already exists. Try a different title."
          : error.message;
        return Response.json({ error: msg }, { status: 422 });
      }
      return Response.json({ item: data });
    }

    // PUT — update by id
    const id = body.id ? String(body.id) : null;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("lead_magnets")
      .update({
        slug,
        title,
        description,
        type,
        pdf_url: pdfUrl,
        external_url: externalUrl,
        cover_image_url: coverImageUrl,
        cta_text: ctaText,
        email_subject: emailSubject,
        category: body.category ? String(body.category) : undefined,
        active,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return Response.json({ item: data });
  }

  if (req.method === "DELETE") {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const id = body.id ? String(body.id) : null;
    if (!id) {
      return Response.json({ error: "Missing id" }, { status: 400 });
    }
    const { error } = await supabase
      .from("lead_magnets")
      .delete()
      .eq("id", id);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
