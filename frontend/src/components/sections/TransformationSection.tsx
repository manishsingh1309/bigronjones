
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import StatCounter from "../ui/StatCounter";
import BrandName from "../shared/BrandName";

const stats = [
  { target: 2000, suffix: "+", label: "Community Members" },
  { target: 20, suffix: "+", label: "Years Coaching" },
  { target: 4, suffix: "", label: "Specialized Programs" },
  { target: 4.9, suffix: "★", label: "Average Rating", decimals: 1 },
];

const results = [
  {
    quote: "Lost 22 lbs in 60 days",
    source: "Men's Alliance Member",
    stars: "★★★★★",
  },
  {
    quote: "Finally consistent after 3 years of trying",
    source: "Women's Wellness Member",
    stars: "★★★★★",
  },
  {
    quote: "My son loves the pediatrics program",
    source: "Pediatrics Program",
    stars: "★★★★★",
  },
];

export default function TransformationSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative overflow-hidden bg-[#0b1020] py-24">
      {/* Subtle diagonal stripe pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #E11D48 0, #E11D48 1px, transparent 0, transparent 50%)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <StatCounter key={s.label} {...s} />
          ))}
        </div>

        {/* Quote */}
        <div ref={ref} className="mt-24 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="font-heading text-4xl uppercase tracking-wider text-white md:text-6xl"
          >
            &ldquo;I Don&apos;t Sell Perfection.
            <br />I Sell Progress.&rdquo;
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 font-heading text-xl tracking-wider text-brand-blue"
          >
            — <BrandName />
          </motion.p>

          <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-brand-red to-brand-blue" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-6 max-w-xl italic text-brand-gray-light font-body"
          >
            Every program is built around where you are, not where you think you
            should be.
          </motion.p>
        </div>

        {/* Result cards */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm"
            >
              <p className="text-sm text-brand-red">{r.stars}</p>
              <p className="mt-3 font-heading text-2xl tracking-wide text-white">
                {r.quote}
              </p>
              <p className="mt-2 text-sm text-brand-gray font-body">
                {r.source}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
