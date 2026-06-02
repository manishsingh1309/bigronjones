import { motion } from "framer-motion";
import { Award, Users, Video, Target, Home, Calendar } from "lucide-react";
import { viewportOnce } from "@/lib/animations";

/**
 * CREDIBILITY STRIP — Premium positioning section
 *
 * Displays 6 key differentiators that build trust and position
 * BigRonJones as a premium, structured coaching program.
 */

const credibilityPoints = [
  {
    icon: Award,
    label: "20+ YEARS COACHING EXPERIENCE",
  },
  {
    icon: Users,
    label: "ADULTS 35+ FOCUS",
  },
  {
    icon: Calendar,
    label: "WEEKLY PRIVATE ZOOM OVERSIGHT",
  },
  {
    icon: Target,
    label: "TRAINING + NUTRITION SUPPORT",
  },
  {
    icon: Home,
    label: "GYM AND HOME STRUCTURE",
  },
  {
    icon: Video,
    label: "VIDEO GUIDED TRAINING",
  },
];

export default function CredibilityStrip() {
  return (
    <section className="relative bg-[#050505] py-12 md:py-16">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {credibilityPoints.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{
                duration: 0.6,
                delay: i * 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <Icon className="h-6 w-6 text-[#E8192C]" strokeWidth={1.75} />
              <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] leading-tight text-white/80">
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
