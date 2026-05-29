
import { useRef } from "react";

import { motion, useInView } from "framer-motion";
import { siteData } from "@/data/site";
import BrandName from "@/components/shared/BrandName";

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-120px" });
  const photoInView = useInView(photoRef, { once: true, margin: "-80px" });

  const { headline, quote, tags, cta, image } = siteData.about;

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#050505] py-24 lg:py-36"
    >
      {/* Atmospheric crimson gradient — replaces CelestialSphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(232,25,44,0.06) 0%, transparent 70%)",
        }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 select-none font-['Bebas_Neue'] leading-none text-white/[0.025]"
        style={{ fontSize: "clamp(8rem, 20vw, 20rem)" }}
      >
        RON
      </span>

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:gap-28 lg:px-10">
        {/* ── Left: cinematic photo reveal ── */}
        <div ref={photoRef} className="relative mx-auto w-full max-w-[520px]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={photoInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="absolute -inset-3 z-0 border border-[#E8192C]/25"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={photoInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="absolute -inset-6 z-0 border border-[#1a1a1a]"
          />

          <div
            className="relative z-10 overflow-hidden"
            style={{ aspectRatio: "3 / 4" }}
          >
            {/* Dual wipe panels (crimson + black) slide up to reveal */}
            <motion.div
              className="absolute inset-0 z-[21] origin-bottom bg-[#E8192C]"
              initial={{ scaleY: 1 }}
              animate={photoInView ? { scaleY: 0 } : { scaleY: 1 }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div
              className="absolute inset-0 z-20 origin-bottom bg-[#050505]"
              initial={{ scaleY: 1 }}
              animate={photoInView ? { scaleY: 0 } : { scaleY: 1 }}
              transition={{ duration: 1.1, delay: 0.05, ease: [0.76, 0, 0.24, 1] }}
            />

            {/* Photo — simple entrance scale (no scroll parallax) */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={photoInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "transform" }}
            >
              <img src={image} alt="Big Ron Jones" loading="lazy" decoding="async" className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
            </motion.div>

            {/* Film grain on photo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 opacity-[0.05]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat",
              }}
            />
          </div>

          {/* 20+ YEARS badge with spring overshoot */}
          <motion.div
            className="absolute -bottom-4 -right-4 z-30 flex h-20 w-20 flex-col items-center justify-center bg-[#E8192C]"
            initial={{ opacity: 0, scale: 0, rotate: -15 }}
            animate={photoInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 0.5, delay: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="font-['Bebas_Neue'] text-2xl leading-none text-white">20+</span>
            <span className="font-['DM_Mono'] text-[8px] tracking-[0.12em] text-white/80">
              YEARS
            </span>
          </motion.div>

          {/* Vertical side label */}
          <motion.div
            className="absolute -left-10 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
            initial={{ opacity: 0, x: -20 }}
            animate={photoInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 1.3 }}
          >
            <div className="h-16 w-[1px] bg-gradient-to-b from-transparent to-[#E8192C]" />
            <p
              className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.35em] text-white/30"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              <BrandName />
            </p>
            <div className="h-16 w-[1px] bg-gradient-to-t from-transparent to-[#E8192C]" />
          </motion.div>
        </div>

        {/* ── Right: copy ── */}
        <div className="flex flex-col gap-6">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span className="h-[1px] w-8 bg-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              MEET <BrandName variant="upper" />
            </span>
          </motion.div>

          <div>
            {headline.map((line, i) => (
              <div key={line} className="overflow-hidden">
                <motion.h2
                  className={`font-['Bebas_Neue'] leading-[0.92] ${
                    i === 1 ? "text-[#E8192C]" : "text-white"
                  }`}
                  style={{ fontSize: "clamp(2.75rem, 6.5vw, 6.5rem)" }}
                  initial={{ y: "105%" }}
                  animate={inView ? { y: 0 } : {}}
                  transition={{
                    duration: 0.85,
                    delay: 0.65 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {line}
                </motion.h2>
              </div>
            ))}
          </div>

          <motion.p
            className="font-['DM_Sans'] text-base leading-[1.75] text-white/65"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            <BrandName /> has spent over 20 years helping real people cut through the noise of fitness culture and actually move the needle on their health.
          </motion.p>

          <motion.p
            className="font-['DM_Sans'] text-base leading-[1.75] text-white/65"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 1.02 }}
          >
            No gimmicks, no unachievable standards. Whether you&rsquo;re a working dad trying to get back in shape, a mom rebuilding her wellness, or anyone over 35 ready to stop settling — <BrandName />&rsquo;s programs meet you exactly where you are.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="cursor-default border border-[#1a1a1a] px-4 py-2 font-['DM_Sans'] text-sm text-white/50 transition-all duration-300 hover:border-[#E8192C] hover:text-white"
              >
                {tag}
              </span>
            ))}
          </motion.div>

          <motion.blockquote
            className="border-l-2 border-[#E8192C] pl-5"
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 1.2 }}
          >
            <p className="font-['DM_Sans'] text-base italic leading-relaxed text-white/75">
              “{quote}”
            </p>
          </motion.blockquote>

          <motion.a
            href="/consult"
            className="inline-flex w-fit items-center gap-3 bg-[#E8192C] px-8 py-4 font-['Bebas_Neue'] text-lg tracking-widest text-white transition-all duration-300 hover:bg-[#b50f1f]"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.35 }}
            whileHover={{ scale: 1.03, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            {cta}
            <span className="text-xl">→</span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
