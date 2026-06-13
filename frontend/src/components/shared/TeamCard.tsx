

import { motion } from "framer-motion";
import { CursorSpotlight } from "@/components/ui/spotlight";
import BrandName from "@/components/shared/BrandName";
import type { TeamMember } from "@/data/team";

interface Props {
  member: TeamMember;
  index?: number;
  variant?: "compact" | "feature";
}

export default function TeamCard({ member, index = 0, variant = "compact" }: Props) {
  if (variant === "feature") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="group relative grid grid-cols-1 overflow-hidden border border-[#E8192C]/30 bg-[#0f0f0f] md:grid-cols-2"
      >
        <CursorSpotlight size={400} color="rgba(232,25,44,0.18)" />
        <div className="relative h-[440px] overflow-hidden md:h-[560px]">
          <motion.div
            className="absolute inset-0 z-20 origin-right bg-[#E8192C]"
            initial={{ scaleX: 1 }}
            whileInView={{ scaleX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.15 }}
          />
          <img src={member.image} alt={member.name} className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-1000 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
        </div>

        <div className="relative z-[2] flex flex-col gap-5 p-8 md:p-12">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            — {member.role}
          </p>
          <h3
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
          >
            {member.id === "ron" ? <BrandName variant="upper" /> : member.name}
          </h3>
          <p className="font-['DM_Sans'] text-sm uppercase tracking-[0.18em] text-white/50">
            {member.specialty}
          </p>
          <div className="flex flex-col gap-3 font-['DM_Sans'] text-base leading-relaxed text-white/65">
            {member.bio.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <blockquote className="border-l-2 border-[#E8192C] pl-4">
            <p className="font-['DM_Sans'] text-sm italic leading-relaxed text-white/75">
              &ldquo;{member.quote}&rdquo;
            </p>
          </blockquote>
          <div className="flex flex-wrap gap-2 pt-2">
            {member.credentials.map((c) => (
              <span
                key={c}
                className="border border-[#1a1a1a] px-3 py-1.5 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/60"
              >
                {c}
              </span>
            ))}
          </div>
          <div className="mt-3 inline-flex w-fit items-center border border-[#1c1c1c] px-4 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
            {member.statusLabel}
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden border border-[#1a1a1a] bg-[#0f0f0f] transition-colors hover:border-[#E8192C]/40"
    >
      <CursorSpotlight size={280} color="rgba(232,25,44,0.16)" />
      <div className="relative h-[320px] overflow-hidden">
        <img src={member.image} alt={member.name} className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/30 to-transparent" />
      </div>

      <div className="relative z-[2] flex flex-1 flex-col p-6">
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
          {member.role}
        </p>
        <h3 className="mt-2 font-['Bebas_Neue'] text-3xl leading-tight tracking-wide text-white">
          {member.id === "ron" ? <BrandName /> : member.name}
        </h3>
        <p className="mt-1 font-['DM_Sans'] text-xs uppercase tracking-[0.15em] text-white/40">
          {member.specialty}
        </p>
        <div className="mt-4 flex flex-col gap-2.5 font-['DM_Sans'] text-[13px] leading-relaxed text-white/60">
          {member.bio.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <div className="mt-6 inline-flex w-full items-center justify-center border border-[#1c1c1c] px-4 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
          {member.statusLabel}
        </div>
      </div>
    </motion.article>
  );
}
