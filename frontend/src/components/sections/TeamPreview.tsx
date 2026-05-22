
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import TeamCard from "@/components/shared/TeamCard";
import { team } from "@/data/team";
import { viewportOnce } from "@/lib/animations";

export default function TeamPreview() {
  const [ron, sean, shelia] = team;

  return (
    <section
      id="team"
      className="relative overflow-hidden bg-[#050505] py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-3xl">
            <motion.p
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
              }}
              className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]"
            >
              — YOUR TEAM
            </motion.p>
            <motion.h2
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
              }}
              className="font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2.75rem, 8vw, 7rem)" }}
            >
              REAL OVERSIGHT.
              <br />
              REAL <span className="text-[#E8192C]">ACCOUNTABILITY.</span>
            </motion.h2>
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
              }}
              className="mt-5 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/60"
            >
              You&rsquo;re not guessing your way through this. You&rsquo;re guided every step by a structured team.
            </motion.p>
          </div>

          <Link
            to="/team"
            className="group inline-flex items-center gap-2 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:text-white"
          >
            Meet The Full Team
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TeamCard member={ron} index={0} />
          <TeamCard member={sean} index={1} />
          <TeamCard member={shelia} index={2} />
        </div>
      </div>
    </section>
  );
}
