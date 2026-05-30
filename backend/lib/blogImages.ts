// Keyless cover-image picker for generated blogs.
//
// Default (no API keys): use Ron's own on-brand photos, chosen by category and
// varied by keyword so consecutive posts don't repeat. If UNSPLASH_ACCESS_KEY
// or PEXELS_API_KEY are set, fetch a fresh topic-matched photo instead and
// fall back to the local photos on any failure.

export interface BlogImage {
  url: string;
  alt: string;
  credit: string; // "" for Ron's own photos
}

// Ron's local photos grouped by category. Always available, on-brand.
const RON_IMAGES: Record<string, string[]> = {
  Fitness: ["/images/ron/gym-curls.jpg", "/images/ron/barbell-curls.jpg", "/images/ron/gym-standing.jpg", "/images/ron/cable-workout.jpg"],
  Nutrition: ["/images/ron/dumbbell-side.jpg", "/images/ron/gym-dumbbells.jpg"],
  Mindset: ["/images/ron/mentality-portrait.jpg", "/images/ron/blue-portrait.jpg", "/images/ron/hoodie-outdoor.jpg"],
  Family: ["/images/ron/pier-lifestyle.jpg", "/images/ron/hoodie-outdoor.jpg"],
  Recovery: ["/images/ron/bike-cardio.jpg", "/images/ron/stairmaster.jpg", "/images/ron/treadmill.jpg"],
  Motivation: ["/images/ron/gym-standing.jpg", "/images/ron/coaching-session.jpg"],
};

const FALLBACK = "/images/ron/gym-bench.jpg";

// Deterministic-ish pick so the same keyword maps to a stable photo, but
// different keywords spread across the available options.
function pickLocal(category: string, keyword: string): BlogImage {
  const list = RON_IMAGES[category] || RON_IMAGES.Fitness;
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) hash = (hash * 31 + keyword.charCodeAt(i)) >>> 0;
  const url = list[hash % list.length] || FALLBACK;
  return { url, alt: `${keyword} — Big Ron Jones`, credit: "" };
}

function imageQuery(keyword: string): string {
  const k = keyword.toLowerCase();
  if (k.includes("strength") || k.includes("muscle")) return "strength training gym";
  if (k.includes("weight") || k.includes("fat") || k.includes("loss")) return "weight loss fitness";
  if (k.includes("nutrition") || k.includes("diet") || k.includes("protein") || k.includes("eat")) return "healthy food meal prep";
  if (k.includes("home")) return "home workout exercise";
  if (k.includes("cardio") || k.includes("run")) return "cardio running fitness";
  if (k.includes("recovery") || k.includes("sleep")) return "stretching recovery fitness";
  return "fitness workout gym";
}

export async function fetchBlogImage(keyword: string, category: string): Promise<BlogImage> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = process.env.PEXELS_API_KEY;
  const query = imageQuery(keyword);

  if (unsplashKey) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape&client_id=${unsplashKey}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          results?: { urls: { regular: string }; alt_description?: string; user: { name: string } }[];
        };
        const photos = data.results ?? [];
        if (photos.length) {
          const p = photos[Math.floor(Math.random() * Math.min(photos.length, 5))];
          return {
            url: p.urls.regular,
            alt: p.alt_description || `${keyword} — fitness`,
            credit: `Photo by ${p.user.name} on Unsplash`,
          };
        }
      }
    } catch {
      /* fall through to local */
    }
  }

  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: pexelsKey }, signal: AbortSignal.timeout(8000) },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          photos?: { src: { large: string }; photographer: string }[];
        };
        const p = data.photos?.[0];
        if (p) {
          return { url: p.src.large, alt: `${keyword} — fitness`, credit: `Photo by ${p.photographer} on Pexels` };
        }
      }
    } catch {
      /* fall through to local */
    }
  }

  return pickLocal(category, keyword);
}
