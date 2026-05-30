// Supabase persistence for blogs. Maps DB rows <-> the frontend `Blog` shape
// (shared/lib/blogStore.ts) so the API surface is unchanged. Every function is
// defensive: if Supabase isn't configured or the `blogs` table doesn't exist
// yet (migration 11 not run), it returns empty/false instead of throwing — so
// the app keeps serving seed blogs and nothing breaks.

import { createServerSupabase } from "./supabase";
import type { Blog } from "../../shared/lib/blogStore";

export interface BlogRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  body: string;
  category: string;
  tags: string[] | null;
  reading_time: string | null;
  challenge_of_the_day: string | null;
  cover_image: string | null;
  author_name: string | null;
  author_avatar: string | null;
  author_title: string | null;
  ron_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  image_credit: string | null;
  trending_keyword: string | null;
  trend_score: number | null;
  trend_date: string | null;
  published: boolean;
  featured: boolean;
  ai_generated: boolean;
  views: number | null;
  published_at: string;
}

function hasSupabase(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function rowToBlog(r: BlogRow): Blog {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle ?? "",
    category: r.category,
    tags: r.tags ?? [],
    body: r.body,
    excerpt: r.excerpt,
    readingTime: r.reading_time ?? "3 min read",
    challengeOfTheDay: r.challenge_of_the_day ?? "",
    publishedAt: r.published_at,
    aiGenerated: r.ai_generated,
    featured: r.featured,
    coverImage: r.cover_image ?? "/images/ron/gym-bench.jpg",
    author: {
      name: r.author_name ?? "Big Ron Jones",
      avatar: r.author_avatar ?? "/images/ron/mentality-portrait.jpg",
      title: r.author_title ?? "Fitness & Wellness Coach",
    },
  };
}

/** All published blogs, newest first. Empty array if unavailable. */
export async function listPublishedBlogs(): Promise<Blog[]> {
  if (!hasSupabase()) return [];
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    return (data as BlogRow[]).map(rowToBlog);
  } catch {
    return [];
  }
}

/** One published blog by slug, or null. */
export async function getBlogBySlug(slug: string): Promise<Blog | null> {
  if (!hasSupabase()) return null;
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return rowToBlog(data as BlogRow);
  } catch {
    return null;
  }
}

/** Recent titles + trending keywords, used to avoid duplicate topics. */
export async function getRecentTitlesAndKeywords(
  limit = 100,
): Promise<{ titles: string[]; keywords: string[] }> {
  if (!hasSupabase()) return { titles: [], keywords: [] };
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("blogs")
      .select("title, trending_keyword")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return { titles: [], keywords: [] };
    const titles = data.map((d: { title: string }) => d.title).filter(Boolean);
    const keywords = data
      .map((d: { trending_keyword: string | null }) => d.trending_keyword)
      .filter((k): k is string => Boolean(k));
    return { titles, keywords };
  } catch {
    return { titles: [], keywords: [] };
  }
}

export interface SaveBlogInput {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  body: string;
  category: string;
  tags?: string[];
  reading_time?: string;
  challenge_of_the_day?: string;
  cover_image?: string;
  ron_image_url?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  image_credit?: string;
  trending_keyword?: string;
  trend_score?: number;
  trend_date?: string;
  featured?: boolean;
}

/** Insert a blog. Ensures a unique slug. Returns the stored Blog or null. */
export async function saveBlog(input: SaveBlogInput): Promise<Blog | null> {
  if (!hasSupabase()) return null;
  const supabase = createServerSupabase();

  // De-dupe slug
  let slug = input.slug;
  try {
    const { data: existing } = await supabase.from("blogs").select("id").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;
  } catch {
    /* table may not exist yet — let the insert surface the real error */
  }

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      slug,
      title: input.title,
      subtitle: input.subtitle ?? null,
      excerpt: input.excerpt,
      body: input.body,
      category: input.category,
      tags: input.tags ?? [],
      reading_time: input.reading_time ?? "3 min read",
      challenge_of_the_day: input.challenge_of_the_day ?? null,
      cover_image: input.cover_image ?? null,
      ron_image_url: input.ron_image_url ?? null,
      meta_title: input.meta_title ?? input.title,
      meta_description: input.meta_description ?? input.excerpt,
      keywords: input.keywords ?? [],
      image_credit: input.image_credit ?? null,
      trending_keyword: input.trending_keyword ?? null,
      trend_score: input.trend_score ?? null,
      trend_date: input.trend_date ?? null,
      featured: input.featured ?? false,
      published: true,
      ai_generated: true,
      published_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to save blog");
  }
  return rowToBlog(data as BlogRow);
}

/** Record a view (analytics row + atomic counter). Best-effort, never throws. */
export async function recordBlogView(
  slug: string,
  meta: { userAgent?: string; referrer?: string } = {},
): Promise<void> {
  if (!hasSupabase()) return;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase.from("blogs").select("id").eq("slug", slug).maybeSingle();
    if (!data) return;
    const blogId = (data as { id: string }).id;
    await supabase.from("blog_analytics").insert({
      blog_id: blogId,
      blog_slug: slug,
      user_agent: meta.userAgent?.slice(0, 200) ?? null,
      referrer: meta.referrer ?? null,
    });
    await supabase.rpc("increment_blog_views", { p_blog_id: blogId });
  } catch {
    /* analytics is best-effort */
  }
}

/** Insert a trend log row; returns its id or null. */
export async function logTrendRun(
  keywords: unknown,
  selected: unknown,
): Promise<string | null> {
  if (!hasSupabase()) return null;
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("trend_logs")
      .insert({
        fetch_date: new Date().toISOString().split("T")[0],
        keywords,
        selected_keywords: selected,
        blogs_generated: 0,
      })
      .select("id")
      .single();
    return (data as { id: string } | null)?.id ?? null;
  } catch {
    return null;
  }
}

export async function updateTrendRunCount(id: string, count: number): Promise<void> {
  if (!hasSupabase() || !id) return;
  try {
    const supabase = createServerSupabase();
    await supabase.from("trend_logs").update({ blogs_generated: count }).eq("id", id);
  } catch {
    /* non-fatal */
  }
}
