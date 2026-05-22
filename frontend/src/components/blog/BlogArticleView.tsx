import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { Link } from "react-router-dom";
import DOMPurify from "isomorphic-dompurify";
import { Calendar, Clock, Share2, Copy, CheckCircle, Zap } from "lucide-react";
import type { Blog } from "@/lib/blogStore";
import { formatBlogDate } from "@/lib/blogUtils";
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import BlogCard from "@/components/blog/BlogCard";
import BrandName from "@/components/shared/BrandName";

const categoryColors: Record<string, string> = {
  Fitness: "bg-brand-red text-white",
  Nutrition: "bg-brand-blue text-white",
  Mindset: "bg-slate-700 text-white",
  Family: "bg-sky-700 text-white",
  Recovery: "bg-cyan-700 text-white",
  Motivation: "bg-rose-700 text-white",
};

interface Props {
  blog: Blog;
  related: Blog[];
}

export default function BlogArticleView({ blog, related }: Props) {
  const [copied, setCopied] = useState(false);
  const [challengeAccepted, setChallengeAccepted] = useState(false);
  const [subState, setSubState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [email, setEmail] = useState("");

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog-article" }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubState("success");
      setEmail("");
      setTimeout(() => setSubState("idle"), 4000);
    } catch {
      setSubState("error");
      setTimeout(() => setSubState("idle"), 3000);
    }
  };

  // Memoize rendered body so re-renders (state changes) don't re-parse markdown.
  // We run our markdown-ish formatting first, then DOMPurify-sanitize the
  // result. DOMPurify whitelists tags + attributes — anything from the AI
  // body that looks like HTML (script tags, inline event handlers, etc.) is
  // stripped before render.
  const renderedBody = useMemo(() => {
    const lines = blog.body.split("\n");
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];

    const sanitize = (html: string) =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["strong", "em", "br", "a"],
        ALLOWED_ATTR: ["class", "href", "target", "rel"],
      });

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const raw = currentParagraph.join(" ").trim();
        if (raw) {
          const formatted = raw
            .replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="text-white font-semibold">$1</strong>',
            )
            .replace(/\*(.*?)\*/g, '<em class="text-brand-blue-light">$1</em>')
            .replace(
              /\b([A-Z]{2,})\b/g,
              '<strong class="text-white font-semibold">$1</strong>',
            );
          elements.push(
            <p
              key={`p-${elements.length}`}
              className="mb-6 text-lg leading-relaxed text-gray-300 font-body"
              dangerouslySetInnerHTML={{ __html: sanitize(formatted) }}
            />,
          );
        }
        currentParagraph = [];
      }
    };

    for (const line of lines) {
      if (line.startsWith("## ")) {
        flushParagraph();
        elements.push(
          <h2
            key={`h2-${elements.length}`}
            className="mb-4 mt-12 border-l-4 border-brand-red pl-4 font-heading text-3xl tracking-wider text-white"
          >
            {line.replace("## ", "")}
          </h2>,
        );
      } else if (line.startsWith("### ")) {
        flushParagraph();
        elements.push(
          <h3
            key={`h3-${elements.length}`}
            className="mb-3 mt-8 text-xl font-bold text-white font-body"
          >
            {line.replace("### ", "")}
          </h3>,
        );
      } else if (line.startsWith("> ")) {
        flushParagraph();
        elements.push(
          <blockquote
            key={`bq-${elements.length}`}
            className="my-8 rounded-r-xl border-l-4 border-brand-blue bg-brand-blue/5 py-4 pl-6 text-xl italic text-brand-gray-light font-body"
          >
            {line.replace("> ", "")}
          </blockquote>,
        );
      } else if (line.trim() === "") {
        flushParagraph();
      } else {
        currentParagraph.push(line);
      }
    }
    flushParagraph();
    return elements;
  }, [blog.body]);

  return (
    <>
      <ReadingProgressBar />
      <div className="bg-[#050505] pt-28">
        {/* HERO — image fills container, text sits at the bottom inside the hero */}
        <section className="relative">
          <div className="relative h-[55vh] max-h-[560px] w-full overflow-hidden">
            <img
              src={blog.coverImage}
              alt={blog.title}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/30" />

            <div className="absolute inset-x-0 bottom-0 z-10">
              <div className="mx-auto max-w-4xl px-6 pb-10 md:pb-14">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span
                    className={`inline-block rounded-full px-3 py-1.5 text-xs font-bold uppercase ${categoryColors[blog.category] || "bg-brand-red text-white"}`}
                  >
                    {blog.category}
                  </span>

                  <h1 className="mt-4 font-heading text-3xl uppercase leading-[1.05] tracking-wider text-white md:text-5xl lg:text-6xl">
                    {blog.title}
                  </h1>

                  {blog.subtitle && (
                    <p className="mt-3 max-w-3xl text-base text-white/75 font-body md:text-lg">
                      {blog.subtitle}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* AUTHOR + META — solid bar BELOW the image so nothing overlaps */}
          <div className="border-y border-[#1c1c1c] bg-[#0d0d0d]">
            <div className="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <img
                    src={blog.author.avatar}
                    alt={blog.author.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="leading-tight">
                  <p className="font-body text-sm font-semibold text-white">
                    <BrandName />
                  </p>
                  <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.18em] text-white/40">
                    Strength &amp; Wellness Coach · Practical Advice For Real
                    World Goals
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} /> {formatBlogDate(blog.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} /> {blog.readingTime}
                </span>
                {blog.aiGenerated && (
                  <span className="flex items-center gap-1 text-brand-red">
                    <span className="sparkle-icon">✦</span> AI · Ron&apos;s
                    Voice
                  </span>
                )}
              </div>
            </div>

            {blog.tags.length > 0 && (
              <div className="mx-auto max-w-4xl px-6 pb-5">
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?category=${blog.category}`}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-body text-xs text-white/60 transition-colors hover:border-brand-red/40 hover:text-brand-red"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="flex gap-12">
            <div className="hidden lg:block">
              <div className="sticky top-32 space-y-3">
                <button
                  onClick={handleCopyLink}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-brand-gray transition-all hover:border-brand-red hover:text-brand-red"
                  title="Copy link"
                  aria-label="Copy article link"
                >
                  {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://x.com/intent/post?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}`,
                      "_blank",
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-brand-gray transition-all hover:border-brand-blue hover:text-brand-blue"
                  title="Share on X"
                  aria-label="Share on X"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="min-w-0 flex-1"
            >
              {renderedBody}

              <div className="mt-16 rounded-2xl border border-brand-red/30 bg-gradient-to-r from-brand-red/10 to-transparent p-8">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-brand-red" />
                  <h3 className="font-heading text-xl tracking-wider text-brand-red">
                    Ron&apos;s Challenge For Today
                  </h3>
                </div>
                <p className="mt-4 text-lg font-semibold text-white font-body">
                  {blog.challengeOfTheDay}
                </p>
                <button
                  onClick={() => setChallengeAccepted(true)}
                  disabled={challengeAccepted}
                  className="mt-4 rounded-full bg-brand-red px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-brand-red-light disabled:opacity-70 font-body"
                >
                  {challengeAccepted
                    ? "✓ Challenge Accepted!"
                    : "I'm Taking the Challenge →"}
                </button>
              </div>

              <div className="mt-12 rounded-2xl border border-white/10 bg-[#111827] p-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
                    <img
                      src={blog.author.avatar}
                      alt={blog.author.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-heading text-2xl tracking-wider text-white">
                      <BrandName />
                    </p>
                    <p className="text-sm text-brand-gray-light font-body">
                      Strength &amp; Wellness Coach
                    </p>
                    <p className="mt-1 text-sm italic text-brand-gray-light font-body">
                      &ldquo;I help real people get real results. No perfect
                      lives required.&rdquo;
                    </p>
                    <div className="mt-3 flex gap-3">
                      <a
                        href="https://www.instagram.com/bigronjones"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-brand-red/30 px-4 py-1.5 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red hover:text-white font-body"
                      >
                        Follow on Instagram
                      </a>
                      <Link
                        to="/consult"
                        className="rounded-full border border-brand-blue/30 px-4 py-1.5 text-xs font-semibold text-brand-blue transition-colors hover:bg-brand-blue hover:text-white font-body"
                      >
                        Book a Consult
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          </div>
        </section>

        {related.length > 0 && (
          <section className="border-t border-white/10 py-16">
            <div className="mx-auto max-w-7xl px-6">
              <h2 className="mb-8 text-center font-heading text-3xl tracking-wider text-white">
                More From <BrandName />
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {related.map((post, i) => (
                  <BlogCard
                    key={post.id}
                    blog={post}
                    variant="compact"
                    index={i}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="border-t border-white/10 py-16">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="font-heading text-3xl uppercase tracking-wider text-white md:text-4xl">
              Enjoyed This Post? Get 3 More Tomorrow.
            </h2>
            <p className="mt-3 text-brand-gray font-body">
              Ron&apos;s AI writes 3 new posts every morning at 6 AM. Subscribe
              and get them delivered before anyone else.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="mt-6 flex flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={subState === "loading" || subState === "success"}
                placeholder="Enter your email"
                aria-label="Email address"
                className="flex-1 rounded-full border border-brand-blue/30 bg-[#111827] px-6 py-3 text-white placeholder-brand-gray outline-none focus:border-brand-red font-body disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={subState === "loading" || subState === "success"}
                className="rounded-full bg-brand-red px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-brand-red-light disabled:opacity-70 font-body"
              >
                {subState === "loading"
                  ? "Subscribing..."
                  : subState === "success"
                    ? "✓ You're In"
                    : subState === "error"
                      ? "Try Again"
                      : "Subscribe Free"}
              </button>
            </form>
            {subState === "error" && (
              <p className="mt-3 text-sm text-red-400 font-body">
                Something went wrong. Please try again in a moment.
              </p>
            )}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-white/10 bg-brand-black/95 px-4 py-3 backdrop-blur-sm lg:hidden">
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              aria-label="Copy article link"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-brand-gray"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://x.com/intent/post?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}`,
                  "_blank",
                )
              }
              aria-label="Share on X"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-brand-gray"
            >
              <Share2 size={16} />
            </button>
          </div>
          <Link
            to="/consult"
            className="rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white font-body"
          >
            Book a Consult
          </Link>
        </div>
      </div>
    </>
  );
}
