
import { useRef } from "react";

import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";

export default function SplineSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      aria-label="Built Different"
      className="relative overflow-hidden border-y border-[#1a1a1a] bg-[#050505]"
      style={{ minHeight: "580px" }}
    >
      {/* Subtle crimson glow on the left */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,25,44,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="mx-auto flex min-h-[580px] max-w-[1400px] flex-col items-stretch px-6 lg:flex-row lg:px-10">
        {/* LEFT — Copy */}
        <div className="flex flex-1 flex-col justify-center py-20 lg:py-0 lg:pr-16">
          <motion.p
            className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            — BUILT FOR ADULTS READY FOR STRUCTURE
          </motion.p>

          <div>
            {["THE STRUCTURE", "THAT FINALLY", "WORKS"].map((line, i) => (
              <div key={line} className="overflow-hidden">
                <motion.h2
                  className={`font-['Bebas_Neue'] leading-[0.9] ${
                    i === 1 ? "text-[#E8192C]" : "text-white"
                  }`}
                  style={{ fontSize: "clamp(2.75rem, 7vw, 6.5rem)" }}
                  initial={{ y: "110%" }}
                  animate={inView ? { y: 0 } : {}}
                  transition={{
                    duration: 0.85,
                    delay: 0.1 + i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {line}
                </motion.h2>
              </div>
            ))}
          </div>

          <motion.div
            className="mt-6 mb-8 flex max-w-md flex-col gap-4 font-['DM_Sans'] text-base leading-relaxed text-white/65"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <p>
              Built around your real life. Backed by weekly accountability. Designed so you stop starting over.
            </p>
            <p>
              No extremes. No confusion. Just a system you can follow and sustain.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link
              to="/programs/trial"
              className="inline-flex w-fit items-center gap-3 bg-[#E8192C] px-8 py-4 font-['Bebas_Neue'] text-lg tracking-widest text-white transition-colors duration-300 hover:bg-[#b50f1f]"
            >
              START YOUR 7-DAY TRIAL
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>

        {/* RIGHT — Ron photo (replaces robot) */}
        <motion.div
          className="relative hidden flex-1 self-stretch lg:block"
          initial={{ opacity: 0, x: 60 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <img src="/assets/ron-hero.jpg" alt="Big Ron Jones coaching" className="object-cover object-center" />

            {/* Left edge gradient — blends into dark section */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent"
            />
            {/* Top + bottom fades */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/85 via-transparent to-[#050505]/30" />

            {/* Crimson vignette tint on right edge */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to left, rgba(232,25,44,0.06) 0%, transparent 60%)",
              }}
            />

            {/* Film grain */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.045]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat",
              }}
            />
          </div>

          {/* Floating stat badge */}
          <motion.div
            className="absolute bottom-8 left-8 z-20 max-w-[260px] border border-[#1c1c1c] bg-[#050505]/90 px-5 py-4 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <p className="font-['Bebas_Neue'] text-4xl leading-none text-[#E8192C]">
              2,000+
            </p>
            <p className="mt-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
              REAL PEOPLE. REAL RESULTS.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
