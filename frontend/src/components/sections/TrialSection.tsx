import { motion } from "framer-motion";
import {
  Dumbbell,
  Apple,
  ClipboardCheck,
  LineChart,
  PlayCircle,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { viewportOnce } from "@/lib/animations";
import { track } from "@/lib/track";

// Section 4 — "Stop Guessing" 7-Day Trial overview. Copy is client-approved
// (see the website revision brief); the six items are exactly what's included
// inside the trial.
const trialFeatures = [
  { icon: Dumbbell, label: "Structured Training" },
  { icon: Apple, label: "Nutrition Guidance" },
  { icon: ClipboardCheck, label: "Accountability" },
  { icon: LineChart, label: "Progress Tracking" },
  { icon: PlayCircle, label: "Video Instruction" },
  { icon: MessageCircle, label: "Direct Support" },
];

export default function TrialSection() {
  return (
    <section id="trial" className="relative overflow-hidden bg-[#0a0a0a] py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(232,25,44,0.10) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-[1400px] px-6 md:px-10">
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
            — THE 7-DAY TRIAL
          </motion.p>
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
          >
            STOP GUESSING. START WITH 7 DAYS OF REAL OVERSIGHT.
          </motion.h2>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
            className="mt-5 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/60"
          >
            Experience how our system works before making a long-term commitment.
          </motion.p>
        </motion.header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {trialFeatures.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-6 transition-colors hover:border-[#E8192C]/40"
            >
              <Icon className="h-7 w-7 text-[#E8192C]" strokeWidth={1.75} />
              <span className="font-['Bebas_Neue'] text-xl tracking-wide text-white sm:text-2xl">
                {label}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 flex flex-col items-center gap-4 text-center"
        >
          <Link
            to="/programs/trial"
            onClick={() => track("trial_start_click", { event_label: "trial_section" })}
            className="inline-flex items-center bg-[#E8192C] px-10 py-5 font-['Bebas_Neue'] text-xl tracking-[0.15em] text-white transition-all hover:scale-105 hover:bg-[#b50f1f]"
          >
            START MY 7 DAY TRIAL
          </Link>
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/40">
            One Week. Real Structure. Real Feedback.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
