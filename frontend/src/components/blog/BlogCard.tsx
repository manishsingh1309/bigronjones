
import { motion } from "framer-motion";

import { Link } from "react-router-dom";
import { formatBlogDate } from "@/lib/blogUtils";
import type { Blog } from "@/lib/blogStore";

const categoryColors: Record<string, string> = {
  Fitness: "bg-brand-red text-white",
  Nutrition: "bg-brand-blue text-white",
  Mindset: "bg-slate-700 text-white",
  Family: "bg-sky-700 text-white",
  Recovery: "bg-cyan-700 text-white",
  Motivation: "bg-rose-700 text-white",
};

interface BlogCardProps {
  blog: Blog;
  variant?: "featured" | "compact";
  index?: number;
  onCategoryClick?: (category: string) => void;
}

export default function BlogCard({
  blog,
  variant = "compact",
  index = 0,
  onCategoryClick,
}: BlogCardProps) {
  const isFeatured = variant === "featured";
  const imageHeight = isFeatured ? "h-72" : "h-48";

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: index * 0.15,
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link to={`/blog/${blog.slug}`} className="group block">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] transition-all duration-500 hover:border-brand-blue/40 hover:shadow-xl hover:shadow-brand-blue/10">
          {/* Image */}
          <div className={`relative ${imageHeight} overflow-hidden`}>
            <img src={blog.coverImage} alt={blog.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" sizes={isFeatured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"} />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black to-transparent" />

            {/* Category badge */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onCategoryClick?.(blog.category);
              }}
              className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold uppercase ${categoryColors[blog.category] || "bg-brand-red text-white"}`}
            >
              {blog.category}
            </button>

            {/* AI Crafted badge */}
            {blog.aiGenerated && (
              <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-brand-blue/40 bg-black/60 px-3 py-1 text-xs text-brand-blue backdrop-blur-sm">
                <span className="sparkle-icon">✦</span> AI Crafted
              </span>
            )}
          </div>

          {/* Content */}
          <div className={isFeatured ? "p-6" : "p-5"}>
            <h3
              className={`font-heading uppercase tracking-wide text-white transition-colors duration-200 group-hover:text-brand-red ${isFeatured ? "text-2xl" : "text-xl"} leading-tight`}
            >
              {blog.title}
            </h3>
            <p
              className={`mt-2 text-sm text-gray-400 font-body ${isFeatured ? "line-clamp-3" : "line-clamp-2"}`}
            >
              {blog.excerpt}
            </p>

            {/* Meta */}
            <div className="mt-3 flex items-center gap-2 text-xs text-brand-gray font-body">
              <span>{blog.readingTime}</span>
              <span>•</span>
              <span>{formatBlogDate(blog.publishedAt)}</span>
            </div>

            {/* Tags */}
            <div className="mt-3 flex flex-wrap gap-2">
              {blog.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-brand-gray-light font-body"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Bottom row */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative h-5 w-5 overflow-hidden rounded-full">
                  <img src={blog.author.avatar} alt={blog.author.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <span className="text-xs text-brand-gray-light font-body">
                  {blog.author.name}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-brand-red transition-all duration-200 group-hover:gap-2 font-body">
                READ POST <span aria-hidden>→</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
