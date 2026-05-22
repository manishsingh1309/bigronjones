
import { motion } from "framer-motion";
import { Compass, Target, TrendingUp } from "lucide-react";
import { CursorSpotlight } from "@/components/ui/spotlight";
import { viewportOnce } from "@/lib/animations";

const pillars = [
  {
    icon: Compass,
    title: "PRACTICAL METHODS",
    desc: "Programs designed for real life — not the gym mythology, the supplement industry, or the perfect diet myth. Things that work when life gets busy.",
  },
  {
    icon: Target,
    title: "REAL-WORLD GOALS",
    desc: "We don't sell you transformation photos. We sell you a sustainable shift you'll be living five years from now. Nothing extreme, nothing temporary.",
  },
  {
    icon: TrendingUp,
    title: "PROVEN RESULTS",
    desc: "2,000+ clients. 4.9/5 rating. 98% retention. The numbers tell you what's working — but the stories tell you why.",
  },
];

export default function PhilosophySection() {
  return (
    <section className="relative bg-[#050505] py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-14 max-w-3xl"
        >
          <motion.p
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
            }}
            className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]"
          >
            — THE PHILOSOPHY
          </motion.p>
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
            }}
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
          >
            BUILT ON THREE
            <br />
            <span className="text-[#E8192C]">CORE BELIEFS.</span>
          </motion.h2>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{
                duration: 0.7,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative flex flex-col gap-5 overflow-hidden border border-[#1a1a1a] bg-[#0f0f0f] p-8 transition-colors hover:border-[#E8192C]/40"
            >
              <CursorSpotlight size={300} color="rgba(232,25,44,0.16)" />
              <div className="relative z-[2]">
                <div className="mb-6 flex h-12 w-12 items-center justify-center bg-[#E8192C]">
                  <p.icon size={20} className="text-white" strokeWidth={2.2} />
                </div>
                <p className="mb-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/40">
                  Pillar {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mb-4 font-['Bebas_Neue'] text-3xl leading-tight tracking-wide text-white">
                  {p.title}
                </h3>
                <p className="font-['DM_Sans'] text-sm leading-relaxed text-white/60">
                  {p.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
