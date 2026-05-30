// Keyless trending-topic source for the blog generator.
//
// Strategy: try Google Trends' public daily RSS (no API key) and keep any
// fitness-adjacent topics, then ALWAYS blend in a curated list of evergreen
// high-intent keywords for Ron's audience (adults 35+). The curated list
// guarantees we always have good topics even when the RSS is empty, blocked,
// or off-topic that day. Results are de-duped and sorted by score.

export interface TrendKeyword {
  keyword: string;
  score: number; // 0-100 estimated search interest
  category: string; // maps to a blog category
  related: string[];
}

const FITNESS_MATCHERS = [
  "workout",
  "diet",
  "exercise",
  "health",
  "body",
  "training",
  "weight",
  "muscle",
  "fitness",
  "protein",
  "gym",
  "cardio",
  "strength",
  "nutrition",
];

// Curated evergreen keywords — always relevant for Ron's 35+ audience.
const CURATED: TrendKeyword[] = [
  { keyword: "strength training for men over 35", score: 88, category: "Fitness", related: ["muscle building", "testosterone"] },
  { keyword: "weight loss after 40 for women", score: 86, category: "Nutrition", related: ["fat loss", "metabolism"] },
  { keyword: "how to build muscle over 35", score: 85, category: "Fitness", related: ["strength", "recovery"] },
  { keyword: "home workout with no equipment", score: 82, category: "Fitness", related: ["bodyweight", "HIIT"] },
  { keyword: "high protein diet plan for busy adults", score: 81, category: "Nutrition", related: ["protein", "meal prep"] },
  { keyword: "cardio for fat loss that actually works", score: 80, category: "Fitness", related: ["running", "intervals"] },
  { keyword: "best recovery routine after workouts", score: 76, category: "Recovery", related: ["sleep", "rest days"] },
  { keyword: "staying consistent with fitness over 40", score: 78, category: "Mindset", related: ["habits", "accountability"] },
  { keyword: "beginner weekly workout plan", score: 77, category: "Fitness", related: ["schedule", "beginner"] },
  { keyword: "accountability coaching for real results", score: 72, category: "Mindset", related: ["coach", "motivation"] },
  { keyword: "healthy eating on a busy schedule", score: 79, category: "Nutrition", related: ["meal prep", "habits"] },
  { keyword: "getting your family active together", score: 70, category: "Family", related: ["kids", "movement"] },
];

function guessCategory(keyword: string): string {
  const k = keyword.toLowerCase();
  if (k.includes("weight") || k.includes("fat") || k.includes("loss")) return "Nutrition";
  if (k.includes("nutrition") || k.includes("diet") || k.includes("protein") || k.includes("eat")) return "Nutrition";
  if (k.includes("recovery") || k.includes("sleep") || k.includes("rest")) return "Recovery";
  if (k.includes("mind") || k.includes("motivation") || k.includes("habit") || k.includes("consistent")) return "Mindset";
  if (k.includes("family") || k.includes("kid")) return "Family";
  return "Fitness";
}

/** Fetch fitness-relevant trending topics, blended with curated keywords. */
export async function fetchFitnessKeywords(): Promise<TrendKeyword[]> {
  const fromRss: TrendKeyword[] = [];

  try {
    const res = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US",
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BigRonJones/1.0)" },
        // Don't let a slow/blocked endpoint stall the whole run.
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.ok) {
      const xml = await res.text();
      const titles: string[] = [];
      for (const m of xml.matchAll(/<title>(?:<!\[CDATA\[)?([^<\]]+)(?:\]\]>)?<\/title>/g)) {
        const t = m[1].trim().toLowerCase();
        if (t && t !== "daily search trends") titles.push(t);
      }
      for (const [i, title] of titles.entries()) {
        if (FITNESS_MATCHERS.some((w) => title.includes(w))) {
          fromRss.push({
            keyword: title,
            score: Math.max(90 - i * 4, 55),
            category: guessCategory(title),
            related: [],
          });
        }
      }
    }
  } catch {
    // RSS unavailable/blocked — curated list carries the run.
  }

  const seen = new Set<string>();
  const unique: TrendKeyword[] = [];
  for (const kw of [...fromRss, ...CURATED]) {
    const key = kw.keyword.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(kw);
    }
  }

  return unique.sort((a, b) => b.score - a.score);
}

/**
 * Pick the best `count` keywords that aren't too similar to recent posts.
 * `recentTitles` are the titles/keywords of the last N blogs.
 */
export function selectBestKeywords(
  available: TrendKeyword[],
  recentTitles: string[],
  count = 3,
): TrendKeyword[] {
  const recent = recentTitles.map((t) => t.toLowerCase());

  const fresh = available.filter((kw) => {
    const k = kw.keyword.toLowerCase();
    return !recent.some(
      (r) =>
        r.includes(k) ||
        k.split(" ").some((word) => word.length > 4 && r.includes(word)),
    );
  });

  // If filtering left fewer than we need, top up from the full list.
  const pool = fresh.length >= count ? fresh : [...fresh, ...available.filter((a) => !fresh.includes(a))];
  return pool.slice(0, count);
}
