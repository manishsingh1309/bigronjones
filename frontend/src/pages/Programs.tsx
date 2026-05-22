import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { programs } from "@/data/programs";
import PageHeader from "@/components/shared/PageHeader";
import FAQAccordion from "@/components/shared/FAQAccordion";
import CTASection from "@/components/sections/CTASection";
import { CursorSpotlight } from "@/components/ui/spotlight";

const faqs = [
  {
    q: "WHO IS THIS FOR?",
    a: "Men and women 30+ who are tired of feeling out of shape, low on energy, and stuck without a clear plan. This is for people ready to follow structure and be held accountable.",
  },
  {
    q: "I'VE TRIED PROGRAMS BEFORE. WHY WOULD THIS WORK?",
    a: "Most programs give you workouts. This gives you oversight. You meet weekly with both a coach and a nutritionist so you stop guessing and start building consistency that lasts.",
  },
  {
    q: "DO I HAVE TO FOLLOW A STRICT DIET?",
    a: "No crash diets. No extremes. You follow a structured, high-protein approach designed to fit your real life so you can stay consistent.",
  },
  {
    q: "ARE THE WEEKLY ZOOM CALLS REQUIRED?",
    a: "Yes. That's where the results come from. These are private, scheduled check-ins designed to keep you accountable, make adjustments, and ensure progress every single week.",
  },
  {
    q: "WHAT IF I DON'T HAVE A GYM?",
    a: "You don't need one. Every program includes gym, home, and resistance band options so you can train wherever you are.",
  },
  {
    q: "CAN I SWITCH BETWEEN MEN'S AND WOMEN'S PROGRAMS?",
    a: "Each program is built specifically for how men and women progress differently. If a change is needed, it's addressed directly during your weekly check-ins.",
  },
  {
    q: "WHAT IF I HAVE A MEDICAL CONDITION OR LIMITATIONS?",
    a: "Everything is adjusted to your starting point. Training, nutrition, and progression are all tailored based on your current condition and capabilities.",
  },
  {
    q: "IS THIS A ONE-SIZE-FITS-ALL PROGRAM?",
    a: "No. The structure is proven, but the execution is personalized. Your plan evolves weekly based on your progress, schedule, and feedback.",
  },
  {
    q: "HOW QUICKLY WILL I SEE RESULTS?",
    a: "Most people feel better within the first few weeks. Noticeable physical changes come with consistency. This is built for results that last, not quick fixes.",
  },
  {
    q: "WHAT MAKES THIS DIFFERENT FROM OTHER ONLINE COACHING?",
    a: "You're not left on your own. You have weekly, private oversight with both training and nutrition. That level of accountability is what most programs are missing.",
  },
];

export default function ProgramsPage() {
  return (
    <>
              <title>Programs | BigRonJones</title>
        <meta
          name="description"
          content="Choose your path and step into a 7-day system built for your life. Men's Fitness Alliance and Women's Wellness — structure for real life, results that stick."
        />
      <section className="relative overflow-hidden bg-[#050505] pt-28 pb-16 md:pt-36 md:pb-20">
        <PageHeader
          eyebrow="ALL PROGRAMS"
          headline={["STRUCTURE FOR REAL LIFE.", "RESULTS THAT STICK."]}
          sub="Choose your path and step into a 7-day system built for your life."
        />
      </section>

      <section className="bg-[#050505] py-12 md:py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {programs
              .filter((p) => p.slug === "mens" || p.slug === "womens")
              .map((program, i) => (
                <motion.article
                  key={program.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex flex-col overflow-hidden border border-[#E8192C]/50 bg-[#0f0f0f] shadow-[0_0_40px_rgba(232,25,44,0.1)] transition-colors duration-500"
                >
                  <CursorSpotlight size={320} color="rgba(232,25,44,0.18)" />

                  <Link to={`/programs/${program.slug}`} className="relative block">
                    <div className="relative h-[260px] w-full overflow-hidden bg-[#0f0f0f]">
                      <img
                        src={program.image}
                        alt={program.title}
                        loading="lazy"
                        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/20 to-transparent" />
                      <span className="absolute right-4 top-4 bg-[#E8192C] px-3 py-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white">
                        {program.badge}
                      </span>
                    </div>
                  </Link>

                  <div className="relative z-[2] flex flex-1 flex-col p-7 md:p-8">
                    <Link to={`/programs/${program.slug}`}>
                      <h3 className="mb-2 font-['Bebas_Neue'] text-3xl tracking-wide text-white transition-colors hover:text-[#E8192C]">
                        {program.title}
                      </h3>
                    </Link>
                    <p className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-[#E8192C]">
                      {program.tagline}
                    </p>
                    <p className="mb-6 font-['DM_Sans'] text-sm leading-relaxed text-white/65">
                      {program.desc}
                    </p>

                    <ul className="mb-7 flex flex-col gap-2.5">
                      {program.features.slice(0, 5).map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 font-['DM_Sans'] text-[13px] text-white/80"
                        >
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#E8192C]" strokeWidth={2.5} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to="/programs/trial"
                          className="inline-flex w-full items-center justify-center bg-[#E8192C] px-6 py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
                        >
                          START 7-DAY TRIAL
                        </Link>
                        <p className="text-center font-['DM_Sans'] text-xs text-white/45">
                          Experience the system before committing
                        </p>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Link
                          to={`/apply?program=${program.slug}`}
                          className="inline-flex w-full items-center justify-center border border-[#1a1a1a] px-6 py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:border-[#E8192C] hover:bg-[#E8192C]/10"
                        >
                          APPLY FOR FULL PROGRAM
                        </Link>
                        <p className="text-center font-['DM_Sans'] text-xs text-white/45">
                          For those ready for structure, accountability, and results now
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
          </div>

          <p className="mt-10 text-center font-['DM_Sans'] text-sm text-white/50">
            Not sure where to start? Begin with the 7-Day Trial.
          </p>
        </div>
      </section>

      <section className="bg-[#050505] py-24 md:py-32">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div className="mb-10 max-w-2xl">
            <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              — FREQUENTLY ASKED
            </p>
            <h2
              className="font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
            >
              CLARITY BEFORE
              <br />
              <span className="text-[#E8192C]">COMMITMENT.</span>
            </h2>
            <p className="mt-5 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/60">
              Everything you need to know before you step into a structured plan.
            </p>
          </div>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      <CTASection />
    </>
  );
}
