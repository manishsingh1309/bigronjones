

import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { team } from "@/data/team";
import BrandName from "@/components/shared/BrandName";

export default function AboutHero() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const ron = team[0];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-[#050505] pt-28 md:pt-36"
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-6 pb-24 md:px-10 lg:grid-cols-[1.1fr_1fr] lg:gap-20 lg:pb-32">
        <div className="flex flex-col gap-7">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <span className="h-[1px] w-8 bg-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              — MEET <BrandName variant="upper" />
            </span>
          </motion.div>

          <div>
            {["REAL COACHING.", "REAL RESULTS.", "NO GIMMICKS."].map((line, i) => (
              <div key={line} className="overflow-hidden">
                <motion.h1
                  initial={{ y: "105%" }}
                  animate={inView ? { y: 0 } : {}}
                  transition={{
                    duration: 0.85,
                    delay: 0.15 + i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`font-['Bebas_Neue'] leading-[0.9] ${
                    i === 1 ? "text-[#E8192C]" : "text-white"
                  }`}
                  style={{ fontSize: "clamp(2.5rem, 8vw, 6.5rem)" }}
                >
                  {line}
                </motion.h1>
              </div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="max-w-xl font-['DM_Sans'] text-base leading-[1.75] text-white/65"
          >
            <BrandName /> has spent over 20 years helping real people cut through the noise of fitness culture. No gimmicks, no unachievable standards. Whether you&rsquo;re a working dad, a rebuilding mom, or anyone over 35 ready to stop settling — <BrandName />&rsquo;s programs meet you exactly where you are. Practical methods, real-world goals, proven results.
          </motion.p>

          <motion.blockquote
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="border-l-2 border-[#E8192C] pl-5"
          >
            <p className="font-['DM_Sans'] text-lg italic leading-relaxed text-white">
              &ldquo;{ron.quote}&rdquo;
            </p>
            <footer className="mt-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
              — <BrandName />
            </footer>
          </motion.blockquote>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.95 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Link
              to="/programs/trial"
              className="inline-flex items-center justify-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
            >
              Start 7-Day Trial
              <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute -inset-3 z-0 border border-[#E8192C]/25"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute -inset-6 z-0 border border-[#1a1a1a]"
          />

          <div
            className="relative z-10 overflow-hidden"
            style={{ aspectRatio: "3 / 4" }}
          >
            <motion.div
              className="absolute inset-0 z-[21] origin-bottom bg-[#E8192C]"
              initial={{ scaleY: 1 }}
              animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
            />
            <img src={ron.image} alt={ron.name} className="object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-60" />
          </div>

          <motion.div
            className="absolute -bottom-5 -right-5 z-30 flex h-24 w-24 flex-col items-center justify-center bg-[#E8192C]"
            initial={{ opacity: 0, scale: 0, rotate: -15 }}
            animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 0.5, delay: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <span className="font-['Bebas_Neue'] text-3xl leading-none text-white">
              20+
            </span>
            <span className="font-['DM_Mono'] text-[8px] tracking-[0.12em] text-white/80">
              YEARS
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
