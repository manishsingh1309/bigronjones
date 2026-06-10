import { Fragment } from "react";
import { motion } from "framer-motion";
import { viewportOnce } from "@/lib/animations";
import BrandName from "@/components/shared/BrandName";

const milestones = [
  {
    year: "2002",
    title: "THE FOUNDATION",
    desc: "Bodybuilding career begins. Discipline, structure, and consistency are built through competition and stage experience.",
  },
  {
    year: "2006",
    title: "THE PROFESSION",
    desc: "Career as a personal trainer begins after graduating from Valdosta State University. Transition from personal passion to professional responsibility.",
  },
  {
    year: "2006–2021",
    title: "THE FIELD WORK",
    desc: "15+ years of in-person coaching. Thousands of sessions with real clients. Real-world experience shapes a method that prioritizes sustainability over trends.",
  },
  {
    year: "2022",
    title: "THE ONLINE PIVOT",
    desc: "First online program launches. Built for adults who need structure, clarity, and a plan that fits real life.",
  },
  {
    year: "2023",
    title: "THE SYSTEMS",
    desc: "Men's Fitness Alliance and Women's Wellness Program are established. Two structured programs designed for adults 35+ seeking long-term results.",
  },
  {
    year: "2024",
    title: "THE EXPANSION",
    desc: "The team forms. A nutritionist and hormone specialist are integrated to strengthen accountability, guidance, and results.",
  },
  {
    year: "2025",
    title: "THE STANDARD",
    desc: "The BigRonJones system is fully refined. Cardio, strength training, and recovery are delivered through structured programming and weekly oversight.",
  },
  {
    year: "PRESENT",
    title: "THE MISSION",
    desc: "Practical advice for real world goals. Helping adults build strength, improve energy, and sustain results without guesswork.",
  },
];

function withBrand(text: string) {
  const parts = text.split(/(BigRonJones)/g);
  return parts.map((part, i) =>
    part === "BigRonJones" ? (
      <BrandName key={i} />
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export default function TimelineSection() {
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
            — THE JOURNEY
          </motion.p>
          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
            }}
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
          >
            FROM ONE COACH
            <br />
            TO A <span className="text-[#E8192C]">MOVEMENT.</span>
          </motion.h2>
        </motion.header>

        <ol className="relative">
          <span
            aria-hidden
            className="absolute left-[26px] top-2 bottom-2 w-px bg-[#1a1a1a] md:left-1/2 md:-translate-x-px"
          />
          {milestones.map((m, i) => {
            const flip = i % 2 === 1;
            return (
              <motion.li
                key={m.year}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: 0.7,
                  delay: i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative flex flex-col gap-4 pb-12 md:grid md:grid-cols-2 md:gap-12 md:flex-row"
              >
                <span
                  className={`absolute left-[18px] top-2 z-[2] h-4 w-4 -translate-x-px rounded-full border-2 border-[#050505] bg-[#E8192C] md:left-1/2 md:-translate-x-1/2 ${
                    i === 0 ? "ring-4 ring-[#E8192C]/30" : ""
                  }`}
                />

                {flip ? <div className="hidden md:block" /> : null}

                <div className="w-full">
                  <p className="font-['Bebas_Neue'] text-4xl leading-none tracking-wide text-[#E8192C]">
                    {m.year}
                  </p>
                  <h3 className="mt-2 font-['Bebas_Neue'] text-2xl tracking-wide text-white">
                    {m.title}
                  </h3>
                  <p className="mt-2 max-w-md font-['DM_Sans'] text-sm leading-relaxed text-white/60 md:max-w-none">
                    {withBrand(m.desc)}
                  </p>
                </div>

                {!flip ? <div className="hidden md:block" /> : null}
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
