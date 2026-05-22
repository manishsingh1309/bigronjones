import { blogStore } from "../../shared/lib/blogStore";


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const slug = searchParams.get("slug");

  if (slug) {
    const blog = blogStore.getBySlug(slug);
    if (!blog) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(blog);
  }

  let blogs = blogStore.getAll();
  if (category && category !== "All") {
    blogs = blogs.filter((b) => b.category === category);
  }

  return Response.json(blogs);
}
