// Public blog read API.
//
// Source of truth is Supabase (AI-generated, persisted). We merge those with
// the in-memory store (seed blogs + same-instance generations) so the page is
// never empty — even before the migration runs or if Supabase is unreachable.
// Supabase rows win on slug collisions.

import { blogStore, type Blog } from "../../shared/lib/blogStore";
import { listPublishedBlogs, getBlogBySlug } from "../lib/blogRepo";

function mergeBySlug(primary: Blog[], secondary: Blog[]): Blog[] {
  const seen = new Set(primary.map((b) => b.slug));
  const merged = [...primary, ...secondary.filter((b) => !seen.has(b.slug))];
  return merged.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  if (slug) {
    const fromDb = await getBlogBySlug(slug);
    const blog = fromDb ?? blogStore.getBySlug(slug);
    if (!blog) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(blog);
  }

  const dbBlogs = await listPublishedBlogs();
  let blogs = mergeBySlug(dbBlogs, blogStore.getAll());

  if (category && category !== "All") {
    blogs = blogs.filter((b) => b.category === category);
  }

  return Response.json(blogs);
}
