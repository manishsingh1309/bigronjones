import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { blogStore, type Blog } from "@/lib/blogStore";
import BlogArticleView from "@/components/blog/BlogArticleView";

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();

  // Resolve from the API (Supabase-backed) first, falling back to the local
  // seed/in-memory store so older links and offline dev keep working.
  const [all, setAll] = useState<Blog[]>(() => blogStore.getAll());
  const [blog, setBlog] = useState<Blog | null>(() =>
    slug ? blogStore.getBySlug(slug) ?? null : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);

    fetch("/api/blogs")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((list: Blog[]) => {
        if (!active || !Array.isArray(list) || list.length === 0) return;
        setAll(list);
        const found = list.find((b) => b.slug === slug);
        if (found) setBlog(found);
      })
      .catch(() => {
        /* keep store fallback */
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [slug]);

  // Record a view once we have a real post (best-effort, fire-and-forget).
  useEffect(() => {
    if (!blog?.slug) return;
    fetch("/api/blog-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: blog.slug }),
    }).catch(() => {});
  }, [blog?.slug]);

  // Still loading and nothing in the local store yet — wait before 404.
  if (!blog && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
      </div>
    );
  }

  if (!blog) return <Navigate to="/404" replace />;

  const sameCategory = all.filter(
    (b) => b.slug !== blog.slug && b.category === blog.category,
  );
  const others = all.filter(
    (b) => b.slug !== blog.slug && !sameCategory.find((c) => c.slug === b.slug),
  );
  const related = [...sameCategory, ...others].slice(0, 3);

  return (
    <>
      <title>{`${blog.title} | BigRonJones`}</title>
      <meta name="description" content={blog.excerpt} />
      <meta property="og:title" content={blog.title} />
      <meta property="og:description" content={blog.excerpt} />
      <meta property="og:type" content="article" />
      <meta property="og:image" content={blog.coverImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={blog.title} />
      <meta name="twitter:description" content={blog.excerpt} />
      <meta name="twitter:image" content={blog.coverImage} />
      <BlogArticleView blog={blog} related={related} />
    </>
  );
}
