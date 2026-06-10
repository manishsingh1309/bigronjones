// Trend-based AI blog generation — v2.
//
// Pipeline: fetch trending fitness keywords (keyless) -> pick 3 fresh ones
// (not recently used) -> generate each post with Gemini in Ron's voice using
// STRUCTURED JSON output -> attach an on-brand cover image -> persist to
// Supabase (and the in-memory store) -> log the run. Runs daily via cron and
// on-demand from the admin "generate now" button.
//
// v2 changes:
//   - Structured output (responseSchema + responseMimeType) so the model
//     returns guaranteed-valid JSON — no more brittle regex parsing.
//   - Model FALLBACK CHAIN (GEMINI_MODELS): tries each model in order and
//     uses the first the API key is allowed to run, skipping models that
//     return 403 (project denied) or 404 (not found). Lets the same code use
//     the best available model now and automatically upgrade later.
//   - Clear error categorization (denied / quota / parse) in logs + response.
//
// Auth: when CRON_SECRET is set, callers must pass it as either
//   Authorization: Bearer <CRON_SECRET>   or   ?secret=<CRON_SECRET>
// If CRON_SECRET is unset (local dev), the endpoint is open for convenience.
//
// Methods: GET or POST. Add ?manual=true for logging clarity on ad-hoc runs.

import {
  GoogleGenerativeAI,
  SchemaType,
  type GenerativeModel,
} from "@google/generative-ai";
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

// Ordered model fallback chain. The first model the key is allowed to run
// wins. Override via env (comma-separated); GEMINI_MODEL kept for back-compat.
const MODEL_CHAIN = (
  process.env.GEMINI_MODELS ||
  process.env.GEMINI_MODEL ||
  "gemini-3-flash-preview,gemini-3.5-flash,gemini-2.5-flash,gemini-2.0-flash"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

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

// Structured-output schema — the model is forced to return exactly this shape.
const BLOG_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING, description: "Compelling title under 65 chars" },
    subtitle: { type: SchemaType.STRING, description: "One-line subtitle" },
    category: {
      type: SchemaType.STRING,
      enum: ["Fitness", "Nutrition", "Mindset", "Family", "Recovery", "Motivation"],
    },
    tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    body: {
      type: SchemaType.STRING,
      description: "Full markdown body, 700-1200 words, ## / ### headings, lists, **bold**",
    },
    excerpt: { type: SchemaType.STRING, description: "2-sentence preview, max 160 chars" },
    readingTime: { type: SchemaType.STRING, description: "e.g. '4 min read'" },
    challengeOfTheDay: { type: SchemaType.STRING, description: "One specific action for today" },
  },
  required: [
    "title",
    "subtitle",
    "category",
    "tags",
    "body",
    "excerpt",
    "readingTime",
    "challengeOfTheDay",
  ],
} as const;

type ErrorKind = "denied" | "notfound" | "quota" | "other";

function classifyError(err: unknown): ErrorKind {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes("403") || msg.includes("permission_denied") || msg.includes("denied access"))
    return "denied";
  if (msg.includes("404") || msg.includes("not found")) return "notfound";
  if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit"))
    return "quota";
  return "other";
}

function authorized(req: Request, url: URL): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev convenience
  const bearer = req.headers.get("authorization");
  if (bearer === `Bearer ${cronSecret}`) return true;
  if (url.searchParams.get("secret") === cronSecret) return true;
  return false;
}

function buildPrompt(keyword: string, recentTitles: string[]): string {
  return `${RON_VOICE_SYSTEM_PROMPT}

Write a complete, SEO-aware blog post targeting the trending topic: "${keyword}".
Write specifically for adults 35+ — real schedules, slower metabolism, joint
care, family and work demands. Keep it PRACTICAL: concrete steps the reader can
act on today, not theory. Stay 100% in Ron's voice (direct, motivating, real).

Do NOT reuse these recent titles: ${recentTitles.slice(0, 12).join(" | ") || "(none yet)"}.`;
}

/**
 * Generate one post, walking the model fallback chain. Returns the parsed blog
 * plus the model that produced it. `startAt` lets later posts begin at the
 * model that already worked, avoiding repeated 403 probes.
 */
async function generateOne(
  genAI: GoogleGenerativeAI,
  prompt: string,
  startAt: number,
): Promise<{ data: GeminiBlog; modelIndex: number; modelName: string }> {
  let lastKind: ErrorKind = "other";
  let lastErr = "";

  for (let i = startAt; i < MODEL_CHAIN.length; i++) {
    const modelName = MODEL_CHAIN[i];
    try {
      const model: GenerativeModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.85,
          responseMimeType: "application/json",
          // @ts-expect-error responseSchema is accepted by the API
          responseSchema: BLOG_SCHEMA,
        },
      });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const data = JSON.parse(raw) as GeminiBlog;
      if (!data.title || !data.body) throw new Error("Incomplete blog from model");
      return { data, modelIndex: i, modelName };
    } catch (err) {
      lastKind = classifyError(err);
      lastErr = err instanceof Error ? err.message : String(err);
      // 403 (denied) / 404 (not found) → this model is unusable; try the next.
      if (lastKind === "denied" || lastKind === "notfound") {
        console.warn(`[BLOG-GEN] model ${modelName} unavailable (${lastKind}) — trying next`);
        continue;
      }
      // quota / parse / other → also try the next model (different quota bucket),
      // but remember the reason so we can report it if everything fails.
      console.warn(`[BLOG-GEN] model ${modelName} failed (${lastKind}): ${lastErr}`);
    }
  }
  const e = new Error(`All models failed (${lastKind}): ${lastErr}`);
  // @ts-expect-error attach kind for caller
  e.kind = lastKind;
  throw e;
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

  console.log(
    `[BLOG-GEN] start — ${isManual ? "MANUAL" : "SCHEDULED"} — models: ${MODEL_CHAIN.join(" → ")}`,
  );

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
    const selected = selectBestKeywords(fresh.length ? fresh : allKeywords, recentTitles, 3);
    console.log("[BLOG-GEN] keywords:", selected.map((k) => k.keyword).join(" | "));

    // 3. Log the run.
    const trendLogId = await logTrendRun(allKeywords.slice(0, 20), selected);

    const genAI = new GoogleGenerativeAI(apiKey);

    const results: Array<Record<string, unknown>> = [];
    let success = 0;
    let workingModelIndex = 0; // advances past denied models after the first try

    for (let i = 0; i < selected.length; i++) {
      const kw = selected[i];
      try {
        const prompt = buildPrompt(kw.keyword, recentTitles);
        const { data, modelIndex, modelName } = await generateOne(
          genAI,
          prompt,
          workingModelIndex,
        );
        workingModelIndex = modelIndex; // reuse the model that worked

        const category = data.category || kw.category || "Fitness";
        const image = await fetchBlogImage(kw.keyword, category);
        const ronPhoto = RON_PHOTOS[(i + new Date().getDate()) % RON_PHOTOS.length];
        const slug = generateSlug(data.title);
        const readingTime = data.readingTime || getReadingTime(data.body);
        const tags = Array.isArray(data.tags) ? data.tags : [];

        // Persist to Supabase (source of truth). Non-fatal on failure — we
        // still mirror to the in-memory store so the post isn't lost.
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
          model: modelName,
          persisted,
        });
        console.log(
          `[BLOG-GEN] ✓ ${data.title} [${modelName}]${persisted ? "" : " (in-memory only — migration 11 not run)"}`,
        );

        // Gentle rate limit between generations.
        if (i < selected.length - 1) await new Promise((r) => setTimeout(r, 1500));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        // @ts-expect-error kind attached by generateOne
        const kind: ErrorKind = err?.kind || classifyError(err);
        console.error(`[BLOG-GEN] ✗ ${kw.keyword} (${kind}):`, msg);
        results.push({ keyword: kw.keyword, status: "error", kind, error: msg });
      }
    }

    if (trendLogId) await updateTrendRunCount(trendLogId, success);

    // Surface a clear hint when the whole run was blocked by the Google project.
    const allDenied =
      success === 0 && results.length > 0 && results.every((r) => r.kind === "denied");
    const allQuota =
      success === 0 && results.length > 0 && results.every((r) => r.kind === "quota");

    return Response.json(
      {
        success: success > 0,
        generated: success,
        total: selected.length,
        results,
        trending_keywords: selected.map((k) => k.keyword),
        models: MODEL_CHAIN,
        ...(allDenied
          ? {
              hint: "Every model returned 403 — the Google API key's project is denied access to the Gemini API. Enable billing / request access, or use a key from a project with Gemini access.",
            }
          : {}),
        ...(allQuota
          ? {
              hint: "Every model hit 429 — the key's free-tier quota is exhausted. Wait for the quota window to reset or enable billing for higher limits.",
            }
          : {}),
        generatedAt: new Date().toISOString(),
      },
      { status: success > 0 ? 200 : 502 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[BLOG-GEN] fatal:", msg);
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
