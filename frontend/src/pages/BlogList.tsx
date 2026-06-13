import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { seedBlogs } from "@/data/seedBlogs";
import type { Blog } from "@/lib/blogStore";
import BlogCard from "@/components/blog/BlogCard";
import BlogFilters from "@/components/blog/BlogFilters";
import { formatBlogDate } from "@/lib/blogUtils";

export default function BlogListingPage() {
  // Seed blogs render instantly (no spinner); the live, AI-generated posts
  // from the API replace them once loaded. On any failure we keep the seed.
  const [blogs, setBlogs] = useState<Blog[]>(seedBlogs);

  useEffect(() => {
    let active = true;
    fetch("/api/blogs")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Blog[]) => {
        if (active && Array.isArray(data) && data.length > 0) setBlogs(data);
      })
      .catch(() => {
        /* keep seed blogs */
      });
    return () => {
      active = false;
    };
  }, []);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = useMemo(() => {
    let result = blogs;
    if (category !== "All") {
      result = result.filter((b) => b.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          b.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [blogs, category, search]);

  const todayPosts = filtered.filter(
    (b) => formatBlogDate(b.publishedAt) === "Today"
  );
  const earlierPosts = filtered.filter(
    (b) => formatBlogDate(b.publishedAt) !== "Today"
  );

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    setSearch("");
  };

  return (
    <>
              <title>Blog — Real Talk From Big Ron | BigRonJones</title>
        <meta
          name="description"
          content="Three new posts every morning, written in Ron's voice. Fitness, nutrition, mindset — all of it straight and practical."
        />
      <div>
        <section className="relative flex min-h-[40vh] items-end overflow-hidden pb-12 pt-32">
          <img
            src="/images/ron/hero-dark.jpg"
            alt="BigRonJones Blog"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/85" />
          <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-red font-body">
                Big Ron&apos;s Blog
              </p>
              <h1 className="font-heading text-5xl uppercase tracking-wider text-white md:text-7xl lg:text-8xl">
                Real Talk.
                <br />
                Every Day.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-brand-gray-light font-body">
                3 fresh posts daily, written in Ron&apos;s voice. Fitness,
                nutrition, mindset — all of it straight and practical.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm font-body">
                <span className="live-dot inline-block h-2 w-2 rounded-full bg-brand-red" />
                <span className="text-brand-red">
                  {todayPosts.length} posts published today
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="sticky top-[92px] z-30 border-b border-white/5 bg-[#111111] py-4 md:top-[108px]">
          <div className="mx-auto max-w-7xl px-6">
            <BlogFilters
              activeCategory={category}
              searchQuery={search}
              onCategoryChange={handleCategoryClick}
              onSearchChange={setSearch}
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-16">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center"
            >
              <p className="text-5xl">📝</p>
              <h3 className="mt-4 font-heading text-2xl tracking-wider text-white">
                No Posts{category !== "All" ? ` in ${category}` : ""} Yet
              </h3>
              <p className="mt-2 text-brand-gray font-body">
                Ron will be covering{" "}
                {category !== "All" ? category : "this topic"} soon — check back
                tomorrow.
              </p>
              <button
                onClick={() => {
                  setCategory("All");
                  setSearch("");
                }}
                className="mt-6 rounded-full bg-brand-red px-6 py-3 font-semibold text-white font-body"
              >
                Browse All Posts
              </button>
            </motion.div>
          ) : (
            <>
              {todayPosts.length > 0 && (
                <section className="mb-16">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-brand-red" />
                    <span className="font-heading text-lg tracking-wider text-white">
                      TODAY
                    </span>
                    <span className="text-sm text-brand-gray font-body">
                      •{" "}
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      • {todayPosts.length} posts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {todayPosts.map((blog, i) => (
                      <BlogCard
                        key={blog.id}
                        blog={blog}
                        variant={i === 0 ? "featured" : "compact"}
                        index={i}
                        onCategoryClick={handleCategoryClick}
                      />
                    ))}
                  </div>
                </section>
              )}

              {earlierPosts.length > 0 && (
                <section>
                  <h3 className="mb-6 font-heading text-lg tracking-wider text-white">
                    Earlier Posts
                  </h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {earlierPosts.slice(0, visibleCount).map((blog, i) => (
                      <BlogCard
                        key={blog.id}
                        blog={blog}
                        variant="compact"
                        index={i}
                        onCategoryClick={handleCategoryClick}
                      />
                    ))}
                  </div>
                  {visibleCount < earlierPosts.length && (
                    <div className="mt-10 text-center">
                      <button
                        onClick={() => setVisibleCount((c) => c + 6)}
                        className="rounded-full border-2 border-brand-red px-8 py-3 font-semibold text-white transition-all hover:bg-brand-red/10 font-body"
                      >
                        Load More Posts
                      </button>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
