import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import type { Blog } from "@/lib/blogStore";

type GenState =
  | "idle"
  | "generating"
  | "streaming-1"
  | "streaming-2"
  | "streaming-3"
  | "done"
  | "error";

function useTypewriter(text: string, speed = 40, active = false) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) {
      setDisplayed("");
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);
  return displayed;
}

interface AIGenerationPanelProps {
  onGenerated: (blogs: Blog[]) => void;
}

export default function AIGenerationPanel({
  onGenerated,
}: AIGenerationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<GenState>("idle");
  const [generatedBlogs, setGeneratedBlogs] = useState<Blog[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const title1 = useTypewriter(
    generatedBlogs[0]?.title || "",
    40,
    state === "streaming-1" ||
      state === "streaming-2" ||
      state === "streaming-3" ||
      state === "done",
  );
  const title2 = useTypewriter(
    generatedBlogs[1]?.title || "",
    40,
    state === "streaming-2" || state === "streaming-3" || state === "done",
  );
  const title3 = useTypewriter(
    generatedBlogs[2]?.title || "",
    40,
    state === "streaming-3" || state === "done",
  );
  const titles = [title1, title2, title3];

  const generate = useCallback(async () => {
    setState("generating");
    setElapsed(0);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 100);

    try {
      const res = await fetch("/api/generate-blogs", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!data.success) throw new Error("Generation failed");

      setGeneratedBlogs(data.blogs);

      setState("streaming-1");
      await new Promise((r) => setTimeout(r, 1500));
      setState("streaming-2");
      await new Promise((r) => setTimeout(r, 1500));
      setState("streaming-3");
      await new Promise((r) => setTimeout(r, 1500));
      setState("done");
      onGenerated(data.blogs);
    } catch {
      setState("error");
    } finally {
      clearInterval(timer);
    }
  }, [onGenerated]);

  const progressWidth =
    state === "generating"
      ? "10%"
      : state === "streaming-1"
        ? "33%"
        : state === "streaming-2"
          ? "66%"
          : state === "streaming-3" || state === "done"
            ? "100%"
            : "0%";

  const statusText =
    state === "generating"
      ? "Connecting to Claude AI..."
      : state === "streaming-1"
        ? "Generating post 1 of 3..."
        : state === "streaming-2"
          ? "Generating post 2 of 3..."
          : state === "streaming-3"
            ? "Generating post 3 of 3..."
            : state === "done"
              ? `✓ 3 posts generated in Ron's voice in ${(elapsed / 1000).toFixed(1)}s`
              : state === "error"
                ? "Generation queued for next refresh"
                : "";

  return (
    <div className="mb-10">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-xl border border-brand-blue/20 bg-[#111827] px-6 py-4 transition-colors hover:border-brand-red/40"
      >
        <div className="flex items-center gap-3">
          <Sparkles size={18} className="text-brand-blue" />
          <span className="font-heading text-lg tracking-wider text-white">
            How Ron&apos;s Daily Blog Works
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-red font-body">DEMO</span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={18} className="text-brand-red" />
          </motion.div>
        </div>
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-brand-blue/20 bg-[#111827] p-8">
              {/* Pipeline diagram */}
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gray font-body">
                Automated Daily Blog Pipeline
              </p>
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    label: "EVERY DAY",
                    sub: "6:00 AM EST",
                    desc: "Auto-trigger",
                  },
                  {
                    label: "CLAUDE AI",
                    sub: "WRITES IN",
                    desc: "Ron's Voice",
                  },
                  {
                    label: "3 BLOG POSTS",
                    sub: "PUBLISHED",
                    desc: "Instantly",
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="relative rounded-lg border border-white/10 bg-white/5 p-4 text-center"
                  >
                    <p className="font-heading text-lg tracking-wider text-brand-red">
                      {step.label}
                    </p>
                    <p className="text-sm text-white font-body">{step.sub}</p>
                    <p className="text-xs text-brand-gray font-body">
                      {step.desc}
                    </p>
                    {i < 2 && (
                      <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-brand-blue md:block">
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p className="mb-6 text-sm text-brand-gray-light font-body">
                Ron&apos;s voice rules: Direct &bull; Practical &bull; No BS
                &bull; Real world focused
              </p>

              {/* Progress bar */}
              {state !== "idle" && (
                <div className="mb-4">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brand-red to-brand-blue"
                      animate={{ width: progressWidth }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-brand-red font-body">
                    {statusText}
                  </p>
                </div>
              )}

              {/* Skeleton / generated cards preview */}
              {state !== "idle" && state !== "error" && (
                <div className="mb-6 grid gap-3 md:grid-cols-3">
                  {[0, 1, 2].map((i) => {
                    const isRevealed =
                      state === "done" ||
                      (state === "streaming-1" && i === 0) ||
                      (state === "streaming-2" && i <= 1) ||
                      (state === "streaming-3" && i <= 2);
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        {isRevealed && generatedBlogs[i] ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <CheckCircle
                                size={14}
                                className="text-green-500"
                              />
                              <span className="text-xs text-green-500 font-body">
                                Post {i + 1} complete
                              </span>
                            </div>
                            <p className="font-heading text-sm tracking-wider text-white">
                              {titles[i]}
                              <span className="animate-pulse text-brand-blue">
                                |
                              </span>
                            </p>
                            <p className="mt-1 text-xs text-brand-gray-light font-body">
                              {generatedBlogs[i].category} •{" "}
                              {generatedBlogs[i].readingTime}
                            </p>
                          </motion.div>
                        ) : (
                          <div className="space-y-2">
                            <div className="skeleton h-3 w-20 rounded" />
                            <div className="skeleton h-4 w-full rounded" />
                            <div className="skeleton h-4 w-3/4 rounded" />
                            <p className="animate-pulse text-xs text-brand-red font-body">
                              AI Writing...
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={
                  state === "generating" ||
                  state === "streaming-1" ||
                  state === "streaming-2" ||
                  state === "streaming-3"
                }
                className="flex items-center gap-2 rounded-full bg-brand-red px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:bg-brand-red-light disabled:opacity-60 font-body"
              >
                {state === "generating" ||
                state === "streaming-1" ||
                state === "streaming-2" ||
                state === "streaming-3" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : state === "done" ? (
                  <>
                    <Sparkles size={18} />
                    Regenerate 3 Posts
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate 3 Posts Now — Live Demo
                  </>
                )}
              </button>

              {state === "error" && (
                <p className="mt-3 text-sm text-amber-400 font-body">
                  AI generation temporarily unavailable. Showing seed content
                  instead. Check your Google Gemini API quota or try again
                  later.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
