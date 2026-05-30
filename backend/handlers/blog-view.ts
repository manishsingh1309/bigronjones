// Records a blog view: inserts an analytics row and bumps the view counter.
// Called from the article page on mount. Best-effort — always returns 200 so a
// missing table / unconfigured Supabase never surfaces an error to readers.

import { recordBlogView } from "../lib/blogRepo";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { slug?: string };
    const slug = body.slug?.trim();
    if (!slug) return Response.json({ ok: false, error: "slug required" }, { status: 400 });

    await recordBlogView(slug, {
      userAgent: req.headers.get("user-agent") ?? undefined,
      referrer: req.headers.get("referer") ?? undefined,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true }); // never block the reader
  }
}
