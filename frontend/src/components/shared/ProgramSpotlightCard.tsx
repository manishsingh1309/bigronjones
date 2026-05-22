

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { CursorSpotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/cn";
import type { ProgramDetail } from "@/data/programs";

interface Props {
  program: ProgramDetail;
  index?: number;
}

export default function ProgramSpotlightCard({ program, index = 0 }: Props) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col overflow-hidden border bg-[#0f0f0f] transition-colors duration-500",
        program.featured
          ? "border-[#E8192C]/50 shadow-[0_0_40px_rgba(232,25,44,0.1)]"
          : "border-[#1a1a1a] hover:border-[#E8192C]/30"
      )}
    >
      <CursorSpotlight size={320} color="rgba(232,25,44,0.18)" />

      <Link to={`/programs/${program.slug}`} className="relative block">
        <div className="relative h-[260px] w-full overflow-hidden bg-[#0f0f0f]">
          <motion.div
            className="absolute inset-0 z-20 origin-right bg-[#E8192C]"
            initial={{ scaleX: 1 }}
            whileInView={{ scaleX: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.8,
              ease: [0.76, 0, 0.24, 1],
              delay: index * 0.15,
            }}
          />
          <img src={program.image} alt={program.title} className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/20 to-transparent" />
          <span
            className={cn(
              "absolute right-4 top-4 px-3 py-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em]",
              program.featured
                ? "bg-[#E8192C] text-white"
                : "border border-[#1a1a1a] bg-[#0f0f0f]/80 text-white/80 backdrop-blur-sm"
            )}
          >
            {program.badge}
          </span>
        </div>
      </Link>

      <div className="relative z-[2] flex flex-1 flex-col p-6">
        <Link to={`/programs/${program.slug}`}>
          <h3 className="mb-1 font-['Bebas_Neue'] text-2xl tracking-wide text-white transition-colors hover:text-[#E8192C]">
            {program.title}
          </h3>
        </Link>
        <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#E8192C]">
          {program.tagline}
        </p>
        <p className="mb-6 font-['DM_Sans'] text-sm leading-relaxed text-white/60">
          {program.desc}
        </p>

        <ul className="mb-6 flex flex-col gap-2">
          {program.features.slice(0, 5).map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 font-['DM_Sans'] text-[13px] text-white/75"
            >
              <Check
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E8192C]"
                strokeWidth={2.5}
              />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="font-['Bebas_Neue'] text-2xl tracking-wide text-[#E8192C]">
              {program.price}
            </span>
            <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
              {program.priceNote}
            </span>
          </div>
          <Link
            to={`/programs/${program.slug}`}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] transition-all",
              program.featured
                ? "bg-[#E8192C] text-white hover:bg-[#b50f1f]"
                : "border border-[#1a1a1a] text-white hover:border-[#E8192C] hover:bg-[#E8192C]"
            )}
          >
            {program.cta}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
