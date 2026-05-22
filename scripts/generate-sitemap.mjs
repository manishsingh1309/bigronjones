// Generates sitemap.xml + robots.txt into dist/ at build time.
// Static routes only — dynamic program/product/blog slugs can be added
// later by parsing the source data files at build time.

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const BASE = process.env.SITE_URL || "https://bigronjones.com";
const OUT_DIR = resolve(root, "dist");

function urlEntry(path, lastmod, freq, priority) {
  return `  <url>
    <loc>${BASE}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const now = new Date().toISOString();

const staticPaths = [
  ["/", "weekly", "1.0"],
  ["/about", "monthly", "0.8"],
  ["/programs", "weekly", "0.9"],
  ["/programs/trial", "weekly", "0.8"],
  ["/programs/mens", "weekly", "0.8"],
  ["/programs/womens", "weekly", "0.8"],
  ["/team", "monthly", "0.7"],
  ["/shop", "weekly", "0.8"],
  ["/consult", "monthly", "0.7"],
  ["/testimonials", "monthly", "0.6"],
  ["/blog", "daily", "0.9"],
  ["/contact", "yearly", "0.5"],
  ["/apply", "monthly", "0.6"],
  ["/privacy", "yearly", "0.3"],
  ["/terms", "yearly", "0.3"],
  ["/refund", "yearly", "0.3"],
  ["/shipping-policy", "yearly", "0.3"],
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPaths.map(([p, f, pr]) => urlEntry(p, now, f, pr)).join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /checkout
Disallow: /checkout/success

Sitemap: ${BASE}/sitemap.xml
Host: ${BASE}
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "sitemap.xml"), xml);
writeFileSync(resolve(OUT_DIR, "robots.txt"), robots);
console.log(`[sitemap] wrote ${staticPaths.length} URLs to dist/sitemap.xml`);
console.log(`[sitemap] wrote dist/robots.txt`);
