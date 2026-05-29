import { motion } from "framer-motion";
import { CalendarCheck, Utensils, ShieldCheck } from "lucide-react";
import { viewportOnce } from "@/lib/animations";

// Section 6 — "Why This Works". Three pillars, copy is client-approved.
const pillars = [
  {
    icon: CalendarCheck,
    title: "Weekly Coaching",
    body: "Private check-ins designed to adjust and keep momentum.",
  },
  {
    icon: Utensils,
    title: "Nutrition Support",
    body: "Practical nutritional structure built for your life.",
  },
  {
    icon: ShieldCheck,
    title: "Accountability",
    body: "Consistent oversight so you are not navigating alone.",
  },
];

export default function WhyThisWorksSection() {
  return (
    <section id="why-this-works" className="bg-[#050505] py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-14 max-w-3xl"
        >
          <motion.p
            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
            className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]"
          >
            — WHY THIS WORKS
          </motion.p>
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
          >
            STRUCTURE, SUPPORT,<br />AND REAL OVERSIGHT.
          </motion.h2>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }, i) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-8 transition-colors hover:border-[#E8192C]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center border border-[#E8192C]/40 bg-[#E8192C]/10 text-[#E8192C]">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
                {title}
              </h3>
              <p className="font-['DM_Sans'] text-[15px] leading-relaxed text-white/65">
                {body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
