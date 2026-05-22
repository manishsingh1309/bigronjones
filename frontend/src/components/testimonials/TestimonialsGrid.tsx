
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { testimonials, type ProgramTestimonialFilter } from "@/data/testimonials";
import { cn } from "@/lib/cn";

const filters: { label: string; value: ProgramTestimonialFilter }[] = [
  { label: "All", value: "All" },
  { label: "7-Day Trial", value: "Trial" },
  { label: "Men's Alliance", value: "Mens" },
  { label: "Women's Wellness", value: "Womens" },
];

export default function TestimonialsGrid() {
  const [filter, setFilter] = useState<ProgramTestimonialFilter>("All");

  const filtered = useMemo(
    () =>
      filter === "All"
        ? testimonials
        : testimonials.filter((t) => t.filter === filter),
    [filter]
  );

  return (
    <section className="bg-[#050505] py-20 md:py-24">
      <div className="mx-auto max-w-[1300px] px-6 md:px-10">
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/40">
            Filter
          </span>
          {filters.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "relative px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] transition-colors",
                  active ? "text-white" : "text-white/40 hover:text-white"
                )}
              >
                {f.label}
                {active && (
                  <motion.span
                    layoutId="t-filter"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#E8192C]"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="columns-1 gap-5 md:columns-2 lg:columns-3 [column-fill:_balance]">
          {filtered.map((t, i) => (
            <motion.blockquote
              key={`${t.name}-${i}`}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: (i % 6) * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mb-5 inline-block w-full break-inside-avoid border border-[#1a1a1a] bg-[#0f0f0f] p-6 transition-colors hover:border-[#E8192C]/40"
            >
              <div className="mb-3 flex items-center gap-1">
                {Array.from({ length: t.stars }).map((_, idx) => (
                  <span key={idx} className="text-[#E8192C]">
                    ★
                  </span>
                ))}
              </div>
              <p className="font-['DM_Sans'] text-[15px] leading-relaxed text-white/85">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="mt-5 flex items-center justify-between">
                <div>
                  <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white">
                    {t.name}
                  </p>
                  <p className="mt-0.5 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/40">
                    {t.program}
                  </p>
                </div>
                {t.result && (
                  <span className="bg-[#E8192C]/10 px-2 py-1 font-['DM_Mono'] text-[10px] tracking-[0.15em] text-[#E8192C]">
                    {t.result}
                  </span>
                )}
              </footer>
            </motion.blockquote>
          ))}
        </div>

        {/* Video placeholder */}
        <div className="mt-16">
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — VIDEO STORIES
          </p>
          <h3
            className="mb-8 font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            HEAR IT IN THEIR <span className="text-[#E8192C]">OWN VOICE.</span>
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="group relative aspect-video w-full overflow-hidden border border-[#1a1a1a] bg-[#0f0f0f]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f0f] to-[#050505]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center bg-[#E8192C] transition-transform group-hover:scale-110">
                    <span className="ml-1 border-y-[10px] border-l-[14px] border-y-transparent border-l-white" />
                  </div>
                </div>
                <p className="absolute bottom-4 left-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60">
                  Coming soon
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
