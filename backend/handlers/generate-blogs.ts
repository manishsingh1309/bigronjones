// Trend-based AI blog generation.
//
// Pipeline: fetch trending fitness keywords (keyless) -> pick 3 fresh ones
// (not recently used) -> generate each post with Gemini in Ron's voice ->
// attach an on-brand cover image -> persist to Supabase (and the in-memory
// store) -> log the run. Designed to run daily via cron and on-demand.
//
// Auth: when CRON_SECRET is set, callers must pass it as either
//   Authorization: Bearer <CRON_SECRET>   or   ?secret=<CRON_SECRET>
// (the daily cron and the admin "generate now" button both do). If CRON_SECRET
// is unset (local dev), the endpoint is open for convenience.
//
// Methods: GET or POST. Add ?manual=true for logging clarity on ad-hoc runs.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { blogStore } from "../../shared/lib/blogStore";
import { RON_VOICE_SYSTEM_PROMPT } from "../../shared/lib/ronVoice";
import { generateSlug, getReadingTime } from "../../shared/lib/blogUtils";
import { fetchFitnessKeywords, selectBestKeywords } from "../lib/trends";
import { fetchBlogImage } from "../lib/blogImages";
import {
  getRecentTitlesAndKeywords,
  saveBlog,
  logTrendRun,
  updateTrendRunCount,
} from "../lib/blogRepo";

// Rotating byline portraits of Ron.
const RON_PHOTOS = [
  "/images/ron/mentality-portrait.jpg",
  "/images/ron/blue-portrait.jpg",
  "/images/ron/coaching-session.jpg",
  "/images/ron/hoodie-outdoor.jpg",
];

interface GeminiBlog {
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  body: string;
  excerpt: string;
  readingTime: string;
  challengeOfTheDay: string;
}

function authorized(req: Request, url: URL): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev convenience
  const bearer = req.headers.get("authorization");
  if (bearer === `Bearer ${cronSecret}`) return true;
  if (url.searchParams.get("secret") === cronSecret) return true;
  return false;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET" && req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  if (!authorized(req, url)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isManual = url.searchParams.get("manual") === "true";
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { success: false, error: "GOOGLE_API_KEY not configured." },
      { status: 500 },
    );
  }

  console.log(`[BLOG-GEN] start — ${isManual ? "MANUAL" : "SCHEDULED"}`);

  try {
    // 1. Recent posts (avoid repeating topics) — empty if table not migrated.
    const { titles: recentTitles, keywords: recentKeywords } =
      await getRecentTitlesAndKeywords(100);

    // 2. Trending keywords (keyless) + pick 3 fresh.
    const allKeywords = await fetchFitnessKeywords();
    const fresh = allKeywords.filter(
      (kw) =>
        !recentKeywords.some((r) =>
          r.toLowerCase().includes(kw.keyword.toLowerCase().slice(0, 8)),
        ),
    );
    const selected = selectBestKeywords(
      fresh.length ? fresh : allKeywords,
      recentTitles,
      3,
    );
    console.log("[BLOG-GEN] keywords:", selected.map((k) => k.keyword).join(" | "));

    // 3. Log the run.
    const trendLogId = await logTrendRun(allKeywords.slice(0, 20), selected);

    const genAI = new GoogleGenerativeAI(apiKey);
    // Model is configurable via GEMINI_MODEL so you can switch (e.g. to
    // gemini-2.5-flash) without a code change. Defaults to gemini-2.0-flash.
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName });

    const results: Array<Record<string, unknown>> = [];
    let success = 0;

    for (let i = 0; i < selected.length; i++) {
      const kw = selected[i];
      try {
        const prompt = `${RON_VOICE_SYSTEM_PROMPT}

Write a complete, SEO-aware blog post targeting the trending topic: "${kw.keyword}".
Write specifically for adults 35+ (real schedules, slower metabolism, joint care).
Do NOT reuse these recent titles: ${recentTitles.slice(0, 10).join(" | ") || "(none yet)"}.

Return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:
{
  "title": "compelling title under 65 chars",
  "subtitle": "one-line subtitle",
  "category": "one of: Fitness, Nutrition, Mindset, Family, Recovery, Motivation",
  "tags": ["tag1", "tag2", "tag3"],
  "body": "full markdown body, 1200-1800 words, using ## and ### headings, lists and **bold**",
  "excerpt": "2-sentence compelling preview (max 160 chars)",
  "readingTime": "X min read",
  "challengeOfTheDay": "one specific action the reader can take today"
}`;

        const result = await model.generateContent(prompt);
        const raw = result.response.text();

        let data: GeminiBlog;
        try {
          data = JSON.parse(raw.replace(/```json|```/g, "").trim());
        } catch {
          const match = raw.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("Gemini returned non-JSON");
          data = JSON.parse(match[0]);
        }
        if (!data.title || !data.body) throw new Error("Incomplete blog from Gemini");

        const category = data.category || kw.category || "Fitness";
        const image = await fetchBlogImage(kw.keyword, category);
        const ronPhoto = RON_PHOTOS[(i + new Date().getDate()) % RON_PHOTOS.length];
        const slug = generateSlug(data.title);
        const readingTime = data.readingTime || getReadingTime(data.body);
        const tags = Array.isArray(data.tags) ? data.tags : [];

        // Persist to Supabase (source of truth for the public site). A failure
        // here (e.g. migration 11 not run yet, transient outage) is non-fatal:
        // we log it and still mirror the post to the in-memory store so it's
        // not lost and still renders this run.
        let saved = null;
        let persisted = false;
        try {
          saved = await saveBlog({
            slug,
            title: data.title,
            subtitle: data.subtitle,
            excerpt: data.excerpt,
            body: data.body,
            category,
            tags,
            reading_time: readingTime,
            challenge_of_the_day: data.challengeOfTheDay,
            cover_image: image.url,
            ron_image_url: ronPhoto,
            meta_title: data.title,
            meta_description: data.excerpt,
            keywords: [...tags, kw.keyword],
            image_credit: image.credit,
            trending_keyword: kw.keyword,
            trend_score: kw.score,
            trend_date: new Date().toISOString().split("T")[0],
            featured: i === 0,
          });
          persisted = Boolean(saved);
        } catch (saveErr) {
          const m = saveErr instanceof Error ? saveErr.message : "save failed";
          console.warn(`[BLOG-GEN] Supabase persist failed (run migration 11?): ${m}`);
        }

        // Mirror into the in-memory store (fallback + same-instance reads).
        blogStore.addBlog({
          id: saved?.id ?? `blog-${Date.now()}-${i}`,
          slug: saved?.slug ?? slug,
          title: data.title,
          subtitle: data.subtitle ?? "",
          category,
          tags,
          body: data.body,
          excerpt: data.excerpt,
          readingTime,
          challengeOfTheDay: data.challengeOfTheDay ?? "",
          publishedAt: new Date().toISOString(),
          aiGenerated: true,
          featured: i === 0,
          coverImage: image.url,
          author: {
            name: "Big Ron Jones",
            avatar: ronPhoto,
            title: "Fitness & Wellness Coach",
          },
        });

        recentTitles.push(data.title);
        success++;
        results.push({
          keyword: kw.keyword,
          status: "success",
          title: data.title,
          slug: saved?.slug ?? slug,
          persisted,
        });
        console.log(`[BLOG-GEN] ✓ ${data.title}${persisted ? "" : " (in-memory only — migration 11 not run)"}`);

        // Gentle rate limit between Gemini calls.
        if (i < selected.length - 1) await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[BLOG-GEN] ✗ ${kw.keyword}:`, msg);
        results.push({ keyword: kw.keyword, status: "error", error: msg });
      }
    }

    if (trendLogId) await updateTrendRunCount(trendLogId, success);

    return Response.json({
      success: true,
      generated: success,
      total: selected.length,
      results,
      trending_keywords: selected.map((k) => k.keyword),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[BLOG-GEN] fatal:", msg);
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
