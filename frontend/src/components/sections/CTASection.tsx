
import { motion } from "framer-motion";
import { viewportOnce } from "@/lib/animations";
import BrandName from "@/components/shared/BrandName";

export default function CTASection() {
  return (
    <section
      id="consult"
      className="relative overflow-hidden bg-[#050505] py-28 md:py-36"
    >
      {/* Energy gradient — replaces ShaderBackground + SparklesCore */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(232,25,44,0.10) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 0% 100%, rgba(232,25,44,0.05) 0%, transparent 50%), radial-gradient(ellipse 100% 80% at 100% 0%, rgba(232,25,44,0.05) 0%, transparent 50%)",
        }}
      />

      {/* Dark radial vignette — keeps headline readable */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_25%,#050505_75%)]" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        className="relative z-[3] mx-auto max-w-3xl px-6 text-center md:px-10"
      >
        <motion.p
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
          className="mb-6 font-['DM_Mono'] text-[11px] uppercase tracking-[0.35em] text-[#E8192C]"
        >
          — READY TO START?
        </motion.p>

        <div className="overflow-hidden">
          <motion.h2
            variants={{ hidden: { y: "110%" }, visible: { y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } } }}
            className="font-['Bebas_Neue'] leading-[0.88] text-white"
            style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}
          >
            YOUR JOURNEY
          </motion.h2>
        </div>
        <div className="overflow-hidden">
          <motion.h2
            variants={{ hidden: { y: "110%" }, visible: { y: 0, transition: { duration: 0.9, delay: 0.08, ease: [0.22, 1, 0.36, 1] } } }}
            className="font-['Bebas_Neue'] leading-[0.88] text-[#E8192C]"
            style={{ fontSize: "clamp(3rem, 10vw, 9rem)" }}
          >
            STARTS NOW.
          </motion.h2>
        </div>

        <motion.p
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
          className="mx-auto mt-8 max-w-xl font-['DM_Sans'] text-lg leading-relaxed text-white/60"
        >
          7 days. Direct coaching from <BrandName />. No commitment. The only thing between you and results is the decision to start.
        </motion.p>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="/programs/trial"
            className="inline-flex items-center bg-[#E8192C] px-10 py-5 font-['Bebas_Neue'] text-xl tracking-[0.15em] text-white transition-all hover:scale-105 hover:bg-[#b50f1f]"
          >
            START 7-DAY TRIAL
          </a>
          <a
            href="/about"
            className="inline-flex items-center border border-[#1c1c1c] px-10 py-5 font-['Bebas_Neue'] text-xl tracking-[0.15em] text-white transition-colors hover:border-[#E8192C]"
          >
            MEET <BrandName variant="upper" />
          </a>
        </motion.div>

        <motion.p
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.6 } } }}
          className="mt-5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/30"
        >
          NO CONTRACTS. NO GIMMICKS. CANCEL ANYTIME.
        </motion.p>
      </motion.div>
    </section>
  );
}
