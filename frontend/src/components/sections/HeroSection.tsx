/**
 * HERO — the signature $10k moment.
 *
 * Sequence (seconds):
 *  0.00  Pure black.
 *  0.20  Crimson vertical line draws down the left edge.
 *  0.30  Crimson wipe panel slides up revealing Ron beneath a secondary dark wipe.
 *  0.40  Ron's photo slides up from below into position, Ken Burns settle from 1.1 → 1.0.
 *  1.20  Film grain fades in over the photo.
 *  1.30  Headline lines rise line-by-line ("PRACTICAL ADVICE / FOR YOUR / REAL WORLD / GOALS.")
 *  1.80  Brand badge, descriptor, name/role block fade in.
 *  2.15  CTAs spring in.
 *  2.40  Floating stats card slides in from right.
 *  2.80  Scroll indicator fades in.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { siteData } from "@/data/site";
import { track } from "@/lib/track";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { tagline, lines, description } = siteData.hero;

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-[#050505]"
    >
      {/* ══ HERO BACKGROUND — SVG opener image (full-bleed) ══ */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ scale: 1.06, opacity: 0 }}
        animate={mounted ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ willChange: "transform, opacity" }}
      >
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-no-repeat hero-opener-bg"
          style={{
            backgroundImage: "url('/assets/hero-opener.svg')",
          }}
        />

        {/* Dark overlay — heavy on the left so the headline stays readable,
            then quickly drops away through the middle so Ron reads cleanly
            on the right without a muddy band crossing his face. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#050505_0%,rgba(5,5,5,0.92)_22%,rgba(5,5,5,0.55)_48%,rgba(5,5,5,0.18)_72%,rgba(5,5,5,0.05)_100%)]" />

        {/* Bottom fade into next section */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />

        {/* Subtle top fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-transparent" />

        {/* Film grain texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.045] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
          }}
        />
      </motion.div>

      {/* ══ LEFT CRIMSON ACCENT LINE ══ */}
      <motion.div
        className="absolute left-0 top-0 z-30 w-[3px] bg-gradient-to-b from-[#E8192C] via-[#E8192C]/70 to-transparent"
        initial={{ scaleY: 0, originY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: "55%" }}
      />

      {/* ══ LEFT COLUMN — TEXT ══ */}
      <motion.div
        style={{ willChange: "opacity, transform" }}
        className="relative z-20 mx-auto w-full max-w-[1400px] px-5 pb-16 pt-28 sm:px-6 md:px-10 md:pt-36"
      >
        <div className="max-w-[720px]">
          {/* Brand badge */}
          <motion.div
            className="mb-6 flex items-center gap-3"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="h-[1px] w-10 bg-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.35em] text-[#E8192C]">
              {tagline}
            </span>
          </motion.div>

          {/* Headline — line-by-line rise */}
          <h1 className="font-['Bebas_Neue'] leading-[0.9]">
            {lines.map((line, i) => {
              const colorClass =
                line.color === "crimson" ? "text-[#E8192C]" : "text-white";
              return (
                <span
                  key={line.text}
                  className="block overflow-hidden"
                  style={{ fontSize: "clamp(3.2rem, 10vw, 10.5rem)" }}
                >
                  <motion.span
                    className={`block ${colorClass}`}
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{
                      duration: 1.0,
                      delay: 1.3 + i * 0.11,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {line.text}
                  </motion.span>
                </span>
              );
            })}
          </h1>

          {/* Subheadline */}
          <motion.p
            className="mt-8 max-w-[620px] font-['DM_Sans'] text-lg leading-relaxed text-white/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.9 }}
          >
            {description}
          </motion.p>

          {/* Body paragraph */}
          <motion.p
            className="mt-6 max-w-[620px] font-['DM_Sans'] text-base leading-[1.75] text-white/65"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.05 }}
          >
            No guessing. No generic plans. No being left alone. Build strength,
            improve health, and create sustainable habits with structured,
            professional coaching designed for your real life.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 2.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.a
              href="/apply"
              onClick={() =>
                track("apply_click", { event_label: "hero_primary_cta" })
              }
              className="group relative overflow-hidden bg-[#E8192C] px-8 py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.15em] text-white"
              whileHover={{ scale: 1.04, backgroundColor: "#b50f1f" }}
              whileTap={{ scale: 0.97 }}
            >
              <span className="relative z-10">Apply For Coaching</span>
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-white/15"
                initial={{ x: "-110%", skewX: -15 }}
                whileHover={{ x: "120%" }}
                transition={{ duration: 0.55 }}
              />
            </motion.a>

            <motion.a
              href="/programs/trial"
              onClick={() =>
                track("trial_start_click", {
                  event_label: "hero_secondary_cta",
                })
              }
              className="border border-[#1c1c1c] px-8 py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.15em] text-white/80 transition-colors hover:border-[#E8192C] hover:text-white"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Start 7-Day Trial
            </motion.a>
          </motion.div>

          {/* Trust line */}
          <motion.p
            className="mt-8 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.3 }}
          >
            20+ Years Coaching • Weekly Oversight • Home &amp; Gym Options
          </motion.p>
        </div>
      </motion.div>

      {/* ══ FLOATING STATS CARD ══ */}
      <motion.aside
        className="absolute bottom-12 right-8 z-30 hidden flex-col overflow-hidden border border-[#1c1c1c] bg-[#0d0d0d]/85 backdrop-blur-md lg:flex"
        initial={{ opacity: 0, x: 60, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.9, delay: 2.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ willChange: "transform, opacity" }}
      >
        {siteData.stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-1 px-7 py-4 ${
              i < siteData.stats.length - 1 ? "border-b border-[#1c1c1c]" : ""
            }`}
          >
            <div className="font-['Bebas_Neue'] text-3xl leading-none tabular-nums text-[#E8192C]">
              {stat.value}
              {stat.suffix}
            </div>
            <div className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.aside>

      {/* ══ SCROLL INDICATOR ══ */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8, duration: 0.8 }}
      >
        <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.35em] text-white/25">
          Scroll
        </span>
        <motion.div
          className="h-10 w-[1px] bg-gradient-to-b from-[#E8192C] to-transparent"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ originY: 0 }}
        />
      </motion.div>

      {/* Bottom vignette for clean handoff to marquee */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-32 bg-gradient-to-t from-[#050505] to-transparent" />
    </section>
  );
}
