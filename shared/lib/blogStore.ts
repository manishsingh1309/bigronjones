import { seedBlogs } from "../data/seedBlogs";

export interface Blog {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  body: string;
  excerpt: string;
  readingTime: string;
  challengeOfTheDay: string;
  publishedAt: string;
  aiGenerated: boolean;
  featured: boolean;
  coverImage: string;
  author: { name: string; avatar: string; title: string };
}

/**
 * Blog persistence.
 *
 * Lazy-loads `node:fs` only on the server (Vercel function runtime). The
 * client bundle never pulls fs in, so this module is browser-safe.
 *
 * Strategy:
 * 1. In-memory cache (fast reads within a warm instance).
 * 2. Optional file-backed mirror at /tmp/blogs.json on the server when
 *    BLOG_STORE_BACKEND=fs — survives across requests on the same lambda.
 * 3. For multi-instance prod scale, swap the disk read/write for Vercel KV
 *    or Upstash Redis. The interface stays identical.
 */

const isServer =
  typeof (globalThis as { window?: unknown }).window === "undefined";
const PERSIST =
  isServer &&
  typeof process !== "undefined" &&
  process.env?.BLOG_STORE_BACKEND === "fs";

type FsModule = typeof import("node:fs");
type PathModule = typeof import("node:path");
let fsMod: FsModule | null = null;
let storeFile: string | null = null;

async function getFs(): Promise<{ fs: FsModule; file: string } | null> {
  if (!PERSIST) return null;
  if (fsMod && storeFile) return { fs: fsMod, file: storeFile };
  try {
    fsMod = (await import("node:fs")) as FsModule;
    const pathMod = (await import("node:path")) as PathModule;
    storeFile = pathMod.join(
      process.env.NODE_ENV === "production" ? "/tmp" : process.cwd(),
      "blogs.json"
    );
    return { fs: fsMod, file: storeFile };
  } catch {
    return null;
  }
}

class BlogStore {
  private blogs: Blog[] = [];
  private hydrated = false;

  private async hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;

    const fsCtx = await getFs();
    if (fsCtx) {
      try {
        if (fsCtx.fs.existsSync(fsCtx.file)) {
          const raw = fsCtx.fs.readFileSync(fsCtx.file, "utf-8");
          const parsed = JSON.parse(raw) as Blog[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.blogs = mergeUnique(parsed, seedBlogs);
            return;
          }
        }
      } catch (err) {
        console.warn("[blogStore] failed to read disk cache:", err);
      }
    }
    this.blogs = [...seedBlogs];
  }

  private hydrateSync() {
    if (this.hydrated) return;
    // Browser path or first hit before async hydrate resolves.
    this.hydrated = true;
    this.blogs = [...seedBlogs];
  }

  private async persist() {
    const fsCtx = await getFs();
    if (!fsCtx) return;
    try {
      fsCtx.fs.writeFileSync(fsCtx.file, JSON.stringify(this.blogs, null, 2));
    } catch (err) {
      console.warn("[blogStore] failed to write disk cache:", err);
    }
  }

  addBlog(blog: Blog) {
    this.hydrateSync();
    if (!this.blogs.find((b) => b.slug === blog.slug)) {
      this.blogs.unshift(blog);
      void this.persist();
    }
  }

  addBlogs(blogs: Blog[]) {
    this.hydrateSync();
    let changed = false;
    for (const b of blogs) {
      if (!this.blogs.find((existing) => existing.slug === b.slug)) {
        this.blogs.unshift(b);
        changed = true;
      }
    }
    if (changed) void this.persist();
  }

  getAll(): Blog[] {
    this.hydrateSync();
    void this.hydrate();
    return [...this.blogs].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  getBySlug(slug: string): Blog | undefined {
    this.hydrateSync();
    void this.hydrate();
    return this.blogs.find((b) => b.slug === slug);
  }

  getByCategory(category: string): Blog[] {
    this.hydrateSync();
    return this.blogs.filter((b) => b.category === category);
  }

  getFeatured(): Blog | undefined {
    this.hydrateSync();
    return this.blogs.find((b) => b.featured) || this.blogs[0];
  }

  getRecent(n: number): Blog[] {
    return this.getAll().slice(0, n);
  }
}

function mergeUnique(primary: Blog[], fallback: Blog[]): Blog[] {
  const seen = new Set(primary.map((b) => b.slug));
  const tail = fallback.filter((b) => !seen.has(b.slug));
  return [...primary, ...tail];
}

export const blogStore = new BlogStore();
