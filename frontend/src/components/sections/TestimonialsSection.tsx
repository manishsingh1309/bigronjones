
import { motion } from "framer-motion";
import { Star, StarHalf } from "lucide-react";
import { Link } from "react-router-dom";
import { siteData, type Testimonial } from "@/data/site";
import { viewportOnce } from "@/lib/animations";
import { useIsMobile } from "@/hooks/useIsMobile";

const STAR_GOLD = "#F59E0B";
const STAR_EMPTY = "#3A3A3A";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`f-${i}`}
          className="h-3.5 w-3.5"
          style={{ color: STAR_GOLD, fill: STAR_GOLD }}
        />
      ))}
      {hasHalf && (
        <StarHalf
          className="h-3.5 w-3.5"
          style={{ color: STAR_GOLD, fill: STAR_GOLD }}
        />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star
          key={`e-${i}`}
          className="h-3.5 w-3.5"
          style={{ color: STAR_EMPTY, fill: STAR_EMPTY }}
        />
      ))}
    </div>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="mb-4 border border-[#1a1a1a] bg-[#0f0f0f] p-6 transition-colors hover:border-[#E8192C]/30">
      <StarRating rating={t.stars} />
      <p className="mt-3 mb-5 font-['DM_Sans'] text-sm leading-relaxed text-white/80">
        “{t.text}”
      </p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-[#E8192C] font-['DM_Mono'] text-xs tracking-[0.1em] text-white">
          {initials(t.name)}
        </div>
        <div>
          <p className="font-['DM_Sans'] text-sm font-medium text-white">{t.name}</p>
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.18em] text-white/40">
            {t.program}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const isMobile = useIsMobile();
  const mid = Math.ceil(siteData.testimonials.length / 2);
  const col1 = siteData.testimonials.slice(0, mid);
  const col2 = siteData.testimonials.slice(mid);
  const doubled1 = [...col1, ...col1];
  const doubled2 = [...col2, ...col2];

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-[#050505] py-24 md:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(232,25,44,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-[1400px] px-6 md:px-10">
        <header className="mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6 }}
            className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.35em] text-[#E8192C]"
          >
            — CLIENT RESULTS
          </motion.p>
          <h2 className="flex flex-wrap gap-x-4 font-['Bebas_Neue'] leading-[0.9] text-white">
            {["REAL", "PEOPLE.", "REAL", "PROGRESS."].map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block overflow-hidden">
                <motion.span
                  className="inline-block"
                  style={{ fontSize: "clamp(2.75rem, 8vw, 7rem)" }}
                  initial={{ y: "110%" }}
                  whileInView={{ y: 0 }}
                  viewport={viewportOnce}
                  transition={{
                    duration: 0.75,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h2>
        </header>

        {isMobile ? (
          <div className="grid grid-cols-1 gap-4">
            {siteData.testimonials.slice(0, 4).map((t, i) => (
              <Card key={`m-${i}`} t={t} />
            ))}
          </div>
        ) : (
          <div className="tcol-pause relative grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-24 bg-gradient-to-b from-[#050505] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 bg-gradient-to-t from-[#050505] to-transparent" />

            <div className="relative h-[620px] overflow-hidden">
              <div className="tcol-up flex flex-col will-change-transform">
                {doubled1.map((t, i) => (
                  <Card key={`a-${i}`} t={t} />
                ))}
              </div>
            </div>
            <div className="relative h-[620px] overflow-hidden">
              <div className="tcol-down flex flex-col will-change-transform">
                {doubled2.map((t, i) => (
                  <Card key={`b-${i}`} t={t} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            to="/testimonials"
            className="inline-flex items-center bg-[#E8192C] px-10 py-5 font-['Bebas_Neue'] text-xl tracking-[0.15em] text-white transition-all hover:scale-105 hover:bg-[#b50f1f]"
          >
            VIEW MORE STORIES
          </Link>
        </div>
      </div>
    </section>
  );
}
