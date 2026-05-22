

import { Link } from "react-router-dom";
import type { Blog } from "@/lib/blogStore";
import { formatBlogDate } from "@/lib/blogUtils";
import BrandName from "@/components/shared/BrandName";

interface BlogSidebarProps {
  relatedPosts: Blog[];
}

export default function BlogSidebar({ relatedPosts }: BlogSidebarProps) {
  return (
    <aside className="space-y-8">
      {/* Author box */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
            <img src="/images/ron/mentality-portrait.jpg" alt="Big Ron Jones" className="object-cover" />
          </div>
          <div>
            <p className="font-heading text-xl tracking-wider text-white">
              <BrandName />
            </p>
            <p className="text-sm text-brand-gray font-body">
              Fitness & Wellness Coach
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm italic text-brand-gray-light font-body">
          &ldquo;I help real people get real results. No perfect lives
          required.&rdquo;
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="https://www.instagram.com/bigronjones"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-brand-red/30 px-4 py-2 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red hover:text-white font-body"
          >
            Follow on Instagram
          </a>
        </div>
      </div>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div>
          <h3 className="mb-4 font-heading text-xl tracking-wider text-white">
            More From Ron
          </h3>
          <div className="space-y-4">
            {relatedPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex gap-3 rounded-xl border border-white/10 bg-[#111827] p-3 transition-all hover:border-brand-blue/30"
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg">
                  <img src={post.coverImage} alt={post.title} className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white transition-colors group-hover:text-brand-red font-body line-clamp-2">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-brand-gray font-body">
                    {formatBlogDate(post.publishedAt)} • {post.readingTime}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
