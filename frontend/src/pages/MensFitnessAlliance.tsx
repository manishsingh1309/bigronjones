import { Fragment } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  ClipboardCheck,
  Dumbbell,
  HeartPulse,
  Moon,
  Salad,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import CrimsonButton from "@/components/shared/CrimsonButton";
import BrandName from "@/components/shared/BrandName";

// The application/checkout lives on Ron's external funnel — the "Apply"
// buttons hand off there, same as everywhere else on the site.
const MENS_FUNNEL = "https://thebigronjones.com/fitnessalliance";

// Inline-render the brand mark (superscript ®) inside copy strings without
// hand-writing JSX for every occurrence.
function withBrand(text: string) {
  return text.split(/(BigRonJones)/g).map((part, i) =>
    part === "BigRonJones" ? (
      <BrandName key={i} />
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

const viewportOnce = { once: true, margin: "-70px" } as const;

// 3 — Program Snapshot ("What's Included")
const INCLUDED = [
  "Weekly Private Zoom With BigRonJones",
  "Weekly Nutrition Zoom With Sean",
  "Personalized Training Plan",
  "Personalized Cardio Plan",
  "Recovery & Lifestyle Guidance",
  "Private Accountability Community",
  "Direct Oversight From Our Team",
  "Adjustments Based On Real Life",
];

// 4 — Upgraded service language (premium framing of the core services)
const SERVICES = [
  {
    icon: Dumbbell,
    title: "Personalized Training Oversight",
    body: "Not random daily workouts — a training structure built for your body, your schedule, and your equipment, adjusted as you progress.",
  },
  {
    icon: Salad,
    title: "Personalized Nutrition Guidance Built Around Your Lifestyle",
    body: "Not a rigid meal plan to white-knuckle — sustainable nutrition direction from Sean that fits the way you actually live.",
  },
  {
    icon: ClipboardCheck,
    title: "Weekly Accountability And Progress Reviews",
    body: "Not a check-in box to tick — a real review of your week so nothing drifts and every adjustment is intentional.",
  },
];

// 5 — The Big Ron Jones Method (three pillars)
const PILLARS = [
  {
    icon: Dumbbell,
    title: "Strength Training",
    body: "Build and protect lean muscle — the foundation of metabolism, joints, and long-term capability.",
  },
  {
    icon: HeartPulse,
    title: "Cardiovascular Health",
    body: "Train the engine that drives energy, endurance, and the health markers that matter at 35+.",
  },
  {
    icon: Moon,
    title: "Recovery",
    body: "Sleep, stress, and recovery structured intentionally — because progress is made between the work, not just during it.",
  },
];

// 7 — Qualification
const FOR_YOU = [
  "You're 35 or older",
  "You want guidance, not guesswork",
  "You have a career, family, and responsibilities",
  "You are ready to follow a plan",
  "You want long-term health, not quick fixes",
  "You are willing to be accountable",
];
const NOT_FOR_YOU = [
  "You want overnight results",
  "You are looking for motivation only",
  "You are unwilling to follow instructions",
  "You are not ready to invest in your health",
];

function SectionEyebrow({ children }: { children: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-[1px] w-8 bg-[#E8192C]" />
      <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
        {children}
      </span>
    </div>
  );
}

export default function MensFitnessAlliancePage() {
  return (
    <>
      <title>Men&apos;s Fitness Alliance | BigRonJones</title>
      <meta
        name="description"
        content="Private Strength & Wellness Oversight for men 35+. Reclaim control of your health, performance, energy, and confidence through structured oversight, expert guidance, and consistent accountability."
      />

      <main className="bg-[#050505] text-white">
        {/* ── 1. HERO — Reposition the offer ─────────────────────────── */}
        <section className="relative overflow-hidden pb-16 pt-28 sm:pt-36">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(232,25,44,0.18) 0%, rgba(0,0,0,0) 60%)",
            }}
          />
          <div className="relative">
            <PageHeader
              eyebrow="MEN'S FITNESS ALLIANCE"
              headline={["PRIVATE STRENGTH & WELLNESS", "OVERSIGHT FOR MEN 35+"]}
              sub="Reclaim control of your health, performance, energy, and confidence through structured oversight, expert guidance, and consistent accountability."
              align="center"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mx-auto mt-9 flex w-full max-w-md flex-col items-center gap-3 px-6 sm:max-w-none sm:flex-row sm:justify-center"
            >
              <CrimsonButton
                href={MENS_FUNNEL}
                external
                size="lg"
                className="w-full sm:w-auto"
              >
                Apply For Coaching <ArrowRight size={15} />
              </CrimsonButton>
              <CrimsonButton
                href="/consult"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Talk To Ron First
              </CrimsonButton>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mx-auto mt-7 max-w-xl px-6 text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/35"
            >
              We don&apos;t sell workouts — we provide private oversight
            </motion.p>

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mx-auto mt-12 max-w-[1100px] px-6 md:px-10"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden border border-[#1a1a1a] sm:aspect-[16/10]">
                <img
                  src="/images/programs/mens-fitness-alliance.png"
                  alt="BigRonJones — Men's Fitness Alliance"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── 2. AUTHORITY — Why Men Trust Me ────────────────────────── */}
        <section className="border-t border-[#1a1a1a] py-16 sm:py-20">
          <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-10 px-6 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewportOnce}
              transition={{ duration: 0.8 }}
              className="relative aspect-[4/5] w-full overflow-hidden border border-[#1a1a1a]"
            >
              <img
                src="/images/team/ron-founder.png"
                alt="BigRonJones"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/70 via-transparent to-transparent" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7 }}
            >
              <SectionEyebrow>Why Men Trust Me</SectionEyebrow>
              <h2 className="font-['Bebas_Neue'] text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                TWENTY YEARS.
                <br />
                <span className="text-[#E8192C]">ZERO GIMMICKS.</span>
              </h2>
              <div className="mt-6 space-y-4 font-['DM_Sans'] text-[15px] leading-relaxed text-white/70 sm:text-base">
                <p>
                  I&apos;ve spent the last 20 years helping men build stronger
                  bodies, better habits, and more control over their health.
                </p>
                <p className="font-['DM_Mono'] text-[13px] uppercase tracking-[0.12em] text-white/50">
                  Not through gimmicks.
                  <br />
                  Not through extreme diets.
                  <br />
                  Not through endless hours in the gym.
                </p>
                <p>
                  Through practical structure, accountability, and consistent
                  execution.
                </p>
                <p className="font-['Bebas_Neue'] text-2xl tracking-wide text-white sm:text-3xl">
                  The same principles I live by myself.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── 3. WHAT'S INCLUDED — Program snapshot ──────────────────── */}
        <section className="border-t border-[#1a1a1a] bg-[#070707] py-16 sm:py-20">
          <div className="mx-auto max-w-[1300px] px-6 md:px-10">
            <div className="mb-10 max-w-2xl">
              <SectionEyebrow>What&apos;s Included</SectionEyebrow>
              <h2 className="font-['Bebas_Neue'] text-4xl leading-none sm:text-5xl md:text-6xl">
                EVERYTHING THE OVERSIGHT COVERS.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {INCLUDED.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.45, delay: (i % 2) * 0.05 }}
                  className="flex items-center gap-3 border border-[#1a1a1a] bg-[#050505] p-4 transition-colors hover:border-[#E8192C]/40 sm:p-5"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#E8192C]/12">
                    <Check size={15} className="text-[#E8192C]" strokeWidth={3} />
                  </span>
                  <span className="font-['DM_Sans'] text-[14px] text-white/85 sm:text-[15px]">
                    {withBrand(item)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. HOW WE WORK WITH YOU — Upgraded service language ─────── */}
        <section className="border-t border-[#1a1a1a] py-16 sm:py-20">
          <div className="mx-auto max-w-[1300px] px-6 md:px-10">
            <div className="mb-10 max-w-2xl">
              <SectionEyebrow>How We Work With You</SectionEyebrow>
              <h2 className="font-['Bebas_Neue'] text-4xl leading-none sm:text-5xl md:text-6xl">
                OVERSIGHT — NOT JUST WORKOUTS.
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {SERVICES.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{ duration: 0.55, delay: i * 0.08 }}
                    className="flex flex-col border border-[#1a1a1a] bg-[#0f0f0f] p-6 transition-colors hover:border-[#E8192C]/50 sm:p-7"
                  >
                    <Icon className="mb-5 text-[#E8192C]" size={26} />
                    <h3 className="mb-3 font-['Bebas_Neue'] text-2xl leading-tight tracking-wide">
                      {s.title}
                    </h3>
                    <p className="font-['DM_Sans'] text-[14px] leading-relaxed text-white/55">
                      {s.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 5. THE BIG RON JONES METHOD ────────────────────────────── */}
        <section className="border-t border-[#1a1a1a] bg-[#070707] py-16 sm:py-20">
          <div className="mx-auto max-w-[1300px] px-6 md:px-10">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="h-[1px] w-8 bg-[#E8192C]" />
                <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
                  The Big Ron Jones Method
                </span>
                <span className="h-[1px] w-8 bg-[#E8192C]" />
              </div>
              <h2 className="font-['Bebas_Neue'] text-4xl leading-[0.95] sm:text-5xl md:text-6xl">
                MOST PEOPLE FOCUS ON WORKOUTS.
                <br />
                <span className="text-[#E8192C]">I FOCUS ON OVERSIGHT.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl font-['DM_Sans'] text-[15px] leading-relaxed text-white/60">
                Inside the Men&apos;s Fitness Alliance, we build everything around
                three pillars.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PILLARS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewportOnce}
                    transition={{ duration: 0.55, delay: i * 0.1 }}
                    className="relative overflow-hidden border border-[#1a1a1a] bg-[#050505] p-7 text-center"
                  >
                    <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#E8192C]/30 bg-[#E8192C]/[0.08]">
                      <Icon className="text-[#E8192C]" size={26} />
                    </span>
                    <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide sm:text-3xl">
                      {p.title}
                    </h3>
                    <p className="mt-3 font-['DM_Sans'] text-[14px] leading-relaxed text-white/55">
                      {p.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6 }}
              className="mx-auto mt-10 max-w-2xl text-center font-['DM_Sans'] text-base leading-relaxed text-white/70"
            >
              When those three areas improve together, energy, confidence, body
              composition, and performance improve with them.
            </motion.p>
          </div>
        </section>

        {/* ── 6. LEADERSHIP CALLOUT — Tone shift ─────────────────────── */}
        <section className="relative overflow-hidden border-t border-[#1a1a1a] py-20 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 60% at 50% 50%, rgba(232,25,44,0.12) 0%, rgba(0,0,0,0) 70%)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7 }}
            className="relative mx-auto max-w-3xl px-6 text-center"
          >
            <h2 className="font-['Bebas_Neue'] text-4xl leading-[0.98] sm:text-6xl md:text-7xl">
              YOU DON&apos;T NEED
              <br />
              ANOTHER PROGRAM.
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-lg leading-relaxed text-white/70 sm:text-xl">
              You need a structure you can actually follow.
            </p>
          </motion.div>
        </section>

        {/* ── 7. QUALIFICATION — Who this is for ─────────────────────── */}
        <section className="border-t border-[#1a1a1a] bg-[#070707] py-16 sm:py-20">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <div className="mb-10 max-w-2xl">
              <SectionEyebrow>Who This Program Is For</SectionEyebrow>
              <h2 className="font-['Bebas_Neue'] text-4xl leading-none sm:text-5xl md:text-6xl">
                IS THIS YOU?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6 }}
                className="border border-[#E8192C]/30 bg-[#E8192C]/[0.05] p-6 sm:p-8"
              >
                <p className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-[#E8192C]">
                  This Program Is For You If
                </p>
                <ul className="flex flex-col gap-3.5">
                  {FOR_YOU.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-3 font-['DM_Sans'] text-[15px] text-white/85"
                    >
                      <Check
                        size={18}
                        strokeWidth={2.5}
                        className="mt-0.5 flex-shrink-0 text-[#E8192C]"
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="border border-[#1a1a1a] bg-[#050505] p-6 sm:p-8"
              >
                <p className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/40">
                  This Program Is Not For You If
                </p>
                <ul className="flex flex-col gap-3.5">
                  {NOT_FOR_YOU.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-3 font-['DM_Sans'] text-[15px] text-white/55"
                    >
                      <X
                        size={18}
                        strokeWidth={2.5}
                        className="mt-0.5 flex-shrink-0 text-white/30"
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 8. CORE MESSAGING + FINAL CTA ──────────────────────────── */}
        <section className="relative overflow-hidden border-t border-[#1a1a1a] py-20 sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 100%, rgba(232,25,44,0.16) 0%, rgba(0,0,0,0) 65%)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7 }}
            className="relative mx-auto max-w-3xl px-6 text-center"
          >
            <p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              The Standard
            </p>
            <h2 className="mt-4 font-['Bebas_Neue'] text-4xl leading-[0.98] sm:text-6xl">
              WE DON&apos;T SELL WORKOUTS.
              <br />
              <span className="text-[#E8192C]">
                WE PROVIDE PRIVATE OVERSIGHT.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
              Private Strength &amp; Wellness Oversight for men 35+. Apply now and
              let&apos;s build the structure your health has been missing.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <CrimsonButton
                href={MENS_FUNNEL}
                external
                size="lg"
                className="w-full sm:w-auto"
              >
                Apply For Coaching <ArrowRight size={15} />
              </CrimsonButton>
              <CrimsonButton
                href="/consult"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Book A 1-on-1 Call First
              </CrimsonButton>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/35">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={13} className="text-[#E8192C]" /> 20+ Years
                Coaching
              </span>
              <span className="inline-flex items-center gap-2">
                <Users size={13} className="text-[#E8192C]" /> Private Community
              </span>
              <span className="inline-flex items-center gap-2">
                <Activity size={13} className="text-[#E8192C]" /> Weekly Oversight
              </span>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
