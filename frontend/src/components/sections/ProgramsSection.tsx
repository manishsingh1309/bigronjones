

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { siteData } from "@/data/site";
import { CursorSpotlight } from "@/components/ui/spotlight";
import { cn } from "@/lib/cn";
import { viewportOnce } from "@/lib/animations";

export default function ProgramsSection() {
  return (
    <section id="programs" className="bg-[#050505] py-24 md:py-32">
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
            — OUR PROGRAMS
          </motion.p>
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.75rem, 8vw, 7rem)" }}
          >
            CHOOSE YOUR<br />STARTING POINT
          </motion.h2>
        </motion.header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {siteData.programs.map((p, i) => (
            <motion.article
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "group relative flex flex-col overflow-hidden border bg-[#0f0f0f] transition-colors duration-500",
                "border-[#E8192C]/50 shadow-[0_0_40px_rgba(232,25,44,0.1)]"
              )}
            >
              <CursorSpotlight size={320} color="rgba(232,25,44,0.18)" />

              <div className="relative h-[320px] w-full overflow-hidden bg-[#0f0f0f]">
                <motion.div
                  className="absolute inset-0 z-20 origin-right bg-[#E8192C]"
                  initial={{ scaleX: 1 }}
                  whileInView={{ scaleX: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: i * 0.15 }}
                />
                <motion.div
                  className="absolute inset-0"
                  initial={{ scale: 1.15 }}
                  whileInView={{ scale: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.15 + 0.1 }}
                >
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]",
                      p.imagePosition ?? "object-center",
                    )}
                  />
                </motion.div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-[#0f0f0f]/10" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
                <span className="absolute right-4 top-4 bg-[#E8192C] px-3 py-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white">
                  {p.badge}
                </span>
              </div>

              <div className="relative z-[2] flex flex-1 flex-col p-7 md:p-8">
                <h3 className="mb-2 font-['Bebas_Neue'] text-3xl leading-tight tracking-wide text-white">
                  {p.title}
                </h3>
                <p className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#E8192C]">
                  {p.tagline}
                </p>

                <div className="mb-6 flex flex-col gap-3 font-['DM_Sans'] text-sm leading-relaxed text-white/65">
                  {p.desc.map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
                </div>

                <ul className="mb-7 flex flex-col gap-2.5">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 font-['DM_Sans'] text-[13px] text-white/80"
                    >
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E8192C]" strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={p.href}
                  className="mt-auto inline-flex w-full items-center justify-center bg-[#E8192C] px-6 py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
                >
                  {p.cta}
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
