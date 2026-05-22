import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Eye,
  Flame,
  LineChart,
  Mail,
  PlayCircle,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import FAQAccordion from "@/components/shared/FAQAccordion";
import CrimsonButton from "@/components/shared/CrimsonButton";
import { Link } from "react-router-dom";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTrialStatus } from "@/hooks/useTrialStatus";

type Program = "mens" | "womens";

const FEATURE_CARDS = [
  {
    icon: PlayCircle,
    title: "7 Daily Training Videos",
    body: "Gym and home 4-day programs built for adults 35+. No fluff.",
  },
  {
    icon: Calendar,
    title: "1:1 Discovery Call",
    body: "Ron sets your baseline before Day 1. Direct, honest, focused.",
  },
  {
    icon: Activity,
    title: "Daily Check-In Dashboard",
    body: "Sleep, soreness, energy, mood. Tracked daily, reviewed by Ron.",
  },
  {
    icon: ShieldCheck,
    title: "Final Review Call on Day 7",
    body: "1:1 to analyze patterns, gaps, and what comes next. Clarity, delivered.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Entry",
    body: "$149 commitment filters for serious buyers.",
  },
  {
    num: "02",
    title: "Immediate Action",
    body: "Book your 1:1 Zoom. Baseline, expectations, control.",
  },
  {
    num: "03",
    title: "Onboarding",
    body: "Keys to Success, dashboard walkthrough, weekly expectations. Low friction.",
  },
  {
    num: "04",
    title: "Education",
    body: "Three core videos: Cardio, Strength, Recovery. The system anchored.",
  },
  {
    num: "05",
    title: "Training Access",
    body: "Gym and home 4-day programs. Built for adults 35+ with real schedules.",
  },
  {
    num: "06",
    title: "Daily Tracking",
    body: "Mood, energy, performance. Optional weight, waist. Dashboard stays simple.",
  },
  {
    num: "07",
    title: "Email Guidance",
    body: "5 emails across 7 days. Reinforce structure. Keep engagement high.",
  },
  {
    num: "08",
    title: "Final Review",
    body: "1:1 Zoom: patterns, gaps, strengths. Where clarity is delivered.",
  },
  {
    num: "09",
    title: "Conversion Point",
    body: "Decide on the 180-day program. Sean G and Dr. Shelia as added value.",
  },
];

const FAQ = [
  {
    q: "What happens immediately after I pay?",
    a: "You're sent to a confirmation page where you book your 1:1 discovery call with Ron via Calendly. Your trial does not start until that call is booked — that's the structure.",
  },
  {
    q: "Do I need a gym?",
    a: "No. Every day includes both a gym version and a home version of the workout. Built for real adult schedules and real garages.",
  },
  {
    q: "Is this for absolute beginners?",
    a: "If you're 35+ and willing to log 7 days of work and feedback, yes. Programming scales to your level. The structure is the same.",
  },
  {
    q: "What happens at the end of Day 7?",
    a: "You complete a final review call with Ron. He reviews your dashboard, your daily metrics, and your video lessons. You decide together whether the 180-day program is the right next step.",
  },
  {
    q: "Who else is on the team?",
    a: "Ron leads. Sean G handles nutrition planning. Dr. Shelia handles hormone and recovery support. They become available when you continue past the trial.",
  },
];

const PROGRAM_DETAILS: Record<Program, { label: string; tagline: string }> = {
  mens: {
    label: "MEN'S PROGRAM",
    tagline: "Strength · cardio · recovery — calibrated for men 35+",
  },
  womens: {
    label: "WOMEN'S PROGRAM",
    tagline: "Cycle-aware programming — calibrated for women 35+",
  },
};

const FEATURE_CHECK = [
  "1:1 Discovery Call with Ron",
  "7-day daily training (gym & home)",
  "Daily check-in dashboard",
  "Sleep, soreness, energy, mood tracking",
  "5 personalized email touchpoints",
  "1:1 Final Review Call on Day 7",
  "Direct path to 180-day continuation",
];

export default function ProgramsTrial() {
  const [program, setProgram] = useState<Program | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const enrollRef = useRef<HTMLDivElement>(null);
  const trial = useTrialStatus();
  const { isAuthenticated, loading: authLoading, signOut } = useAuth();
  // Already enrolled — render the existing-member view instead of the
  // enroll form to prevent a second Stripe charge.
  const alreadyEnrolled = trial.hasTrial && !trial.loading;
  // Account is required before purchase so the trial, payment record, and
  // dashboard access are all tied to a real Supabase user — guest purchases
  // create orphan rows nobody can sign in to claim.
  const needsAuth = !authLoading && !isAuthenticated;

  useEffect(() => {
    document.title = "7-Day Oversight Trial | BigRonJones®";
  }, []);

  // Pre-fill email/name from a logged-in session if available.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const u = data.user;
      if (u?.email) setEmail((prev) => prev || u.email!);
      const meta = (u?.user_metadata || {}) as Record<string, unknown>;
      const fullName =
        (meta.full_name as string) || (meta.name as string) || "";
      if (fullName) setName((prev) => prev || fullName);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canEnroll = useMemo(
    () =>
      isAuthenticated &&
      Boolean(program) &&
      /^\S+@\S+\.\S+$/.test(email.trim()),
    [isAuthenticated, program, email],
  );

  function scrollToEnroll() {
    enrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function startCheckout() {
    if (!canEnroll || !program) return;
    setSubmitting(true);
    setError("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        signal: controller.signal,
        body: JSON.stringify({
          checkoutType: "trial",
          programType: program,
          email: email.trim(),
          name: name.trim() || undefined,
          items: [
            {
              id: `trial-${program}`,
              slug: `trial-${program}`,
              name: `7-Day Oversight Trial — ${program === "mens" ? "Men's" : "Women's"}`,
              price: 149,
              quantity: 1,
            },
          ],
          total: 149,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) {
        throw new Error(json.error || `Checkout failed (HTTP ${res.status})`);
      }
      window.location.assign(json.url);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "AbortError"
          ? "Checkout timed out. Refresh the page and try again."
          : err instanceof Error
            ? err.message
            : "Checkout failed";
      setError(msg);
      setSubmitting(false);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  if (alreadyEnrolled) {
    return (
      <main className="min-h-screen bg-[#050505] text-white">
        <section className="relative overflow-hidden px-6 pt-28 pb-20 sm:pt-36 md:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(232,25,44,0.18) 0%, rgba(0,0,0,0) 60%)",
            }}
          />
          <div className="relative mx-auto max-w-[900px] text-center">
            <CheckCircle2 size={42} className="mx-auto mb-6 text-[#E8192C]" />
            <p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              You're Already Enrolled
            </p>
            <h1 className="mt-3 font-['Bebas_Neue'] text-5xl leading-[0.95] sm:text-7xl">
              YOUR 7-DAY TRIAL
              <br />
              IS ALREADY ACTIVE.
            </h1>
            <p className="mx-auto mt-5 max-w-xl font-['DM_Sans'] text-[15px] leading-relaxed text-white/60">
              {trial.programType === "mens"
                ? "Men's Program · "
                : trial.programType === "womens"
                  ? "Women's Program · "
                  : ""}
              {trial.trialIsComplete
                ? "Trial complete — your continuation window is open."
                : trial.trialDay
                  ? `You're on Day ${trial.trialDay} of 7.`
                  : "Your dashboard is ready."}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to={trial.trialIsComplete ? "/continue" : "/dashboard"}
                className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
              >
                {trial.trialIsComplete
                  ? "View Continuation →"
                  : "Go to My Dashboard →"}
              </Link>
              {!trial.hasBookedCalendly && !trial.trialIsComplete && (
                <a
                  href="https://calendly.com/bigronjonesllc/discovery-call"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-[#1c1c1c] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/65 hover:border-[#E8192C] hover:text-white"
                >
                  Book Activation Call
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#050505] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36">
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
            eyebrow="7-DAY OVERSIGHT TRIAL"
            headline={["7 DAYS.", "DIRECT OVERSIGHT."]}
            sub="Two 1:1 calls with Ron. Daily tracking he actually reviews. Real programming for adults 35+."
            align="center"
          />
          <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 px-6">
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-white/40">
              One-Time Payment
            </span>
            <span className="font-['Bebas_Neue'] text-[80px] leading-none text-white sm:text-[112px]">
              $149
            </span>
            <CrimsonButton size="lg" onClick={scrollToEnroll}>
              START YOUR TRIAL — $149
            </CrimsonButton>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="border-t border-[#1a1a1a] py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="mb-10 flex items-center gap-3">
            <span className="h-[1px] w-8 bg-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              What You Get
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group border border-[#1a1a1a] bg-[#0f0f0f] p-7 transition-colors hover:border-[#E8192C]/50"
                >
                  <Icon className="mb-5 text-[#E8192C]" size={26} />
                  <h3 className="mb-2 font-['Bebas_Neue'] text-2xl tracking-wide">
                    {feat.title}
                  </h3>
                  <p className="font-['DM_Sans'] text-[14px] leading-relaxed text-white/55">
                    {feat.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works — 9 steps */}
      <section className="border-t border-[#1a1a1a] bg-[#070707] py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr] md:items-end">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-[1px] w-8 bg-[#E8192C]" />
                <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
                  How It Works
                </span>
              </div>
              <h2 className="font-['Bebas_Neue'] text-5xl leading-none sm:text-6xl">
                NINE STEPS.
                <br />
                ZERO GUESSING.
              </h2>
            </div>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/55">
              Every step is engineered. Entry filters serious buyers. Onboarding
              sets baseline. Daily tracking gives Ron real signal. The final
              review delivers clarity. No fluff between.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                className="border border-[#1a1a1a] bg-black p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-['Bebas_Neue'] text-4xl text-[#E8192C]">
                    {step.num}
                  </span>
                  <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-white/55">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enroll */}
      <section
        ref={enrollRef}
        id="enroll"
        className="border-t border-[#1a1a1a] py-20"
      >
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <div className="mb-10 flex items-center gap-3">
            <span className="h-[1px] w-8 bg-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              Enroll
            </span>
          </div>
          <h2 className="mb-3 font-['Bebas_Neue'] text-5xl leading-none sm:text-6xl">
            CHOOSE YOUR TRACK.
          </h2>
          <p className="mb-10 max-w-2xl text-[15px] leading-relaxed text-white/55">
            Programming and content adapt to track. Pick once — you can switch
            at the discovery call if it doesn't fit.
          </p>

          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            {(Object.keys(PROGRAM_DETAILS) as Program[]).map((p) => {
              const isSel = program === p;
              const detail = PROGRAM_DETAILS[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProgram(p)}
                  aria-pressed={isSel}
                  style={{
                    background: isSel
                      ? "linear-gradient(135deg, rgba(232,25,44,0.18) 0%, rgba(232,25,44,0.04) 100%)"
                      : "#0f0f0f",
                    boxShadow: isSel
                      ? "inset 0 0 0 2px #E8192C, 0 0 32px rgba(232,25,44,0.15)"
                      : "inset 0 0 0 1px #1a1a1a",
                  }}
                  className="relative p-7 text-left transition-all duration-200 hover:translate-y-[-2px]"
                >
                  {isSel && (
                    <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center bg-[#E8192C] text-white">
                      <CheckCircle2 size={16} strokeWidth={2.5} />
                    </span>
                  )}
                  <div className="mb-3 flex items-center gap-3">
                    {p === "mens" ? (
                      <Flame
                        size={22}
                        className={isSel ? "text-[#E8192C]" : "text-white/40"}
                      />
                    ) : (
                      <Target
                        size={22}
                        className={isSel ? "text-[#E8192C]" : "text-white/40"}
                      />
                    )}
                    <span
                      className={
                        "font-['Bebas_Neue'] text-3xl tracking-wide " +
                        (isSel ? "text-white" : "text-white/85")
                      }
                    >
                      {detail.label}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-white/60">
                    {detail.tagline}
                  </p>
                  <span
                    className={
                      "mt-5 inline-flex items-center gap-2 font-['DM_Mono'] text-[10px] font-bold uppercase tracking-[0.2em] " +
                      (isSel ? "text-[#E8192C]" : "text-white/35")
                    }
                  >
                    {isSel ? "✓ SELECTED" : "TAP TO SELECT"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pricing card */}
          <div className="grid grid-cols-1 gap-6 border border-[#1a1a1a] bg-[#0f0f0f] p-5 sm:p-7 md:grid-cols-[1.2fr_1fr] md:gap-8 md:p-10">
            <div>
              <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
                7-Day Oversight Trial
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-['Bebas_Neue'] text-6xl sm:text-7xl leading-none">
                  $149
                </span>
                <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white/40">
                  one-time
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                {FEATURE_CHECK.map((line) => (
                  <li
                    key={line}
                    className="flex gap-3 text-[14px] text-white/70"
                  >
                    <CheckCircle2
                      size={16}
                      className="mt-0.5 shrink-0 text-[#E8192C]"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              {needsAuth ? (
                <div className="flex flex-col gap-3 border border-[#E8192C]/40 bg-[#E8192C]/[0.07] p-5">
                  <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
                    Account required
                  </p>
                  <p className="font-['DM_Sans'] text-[14px] leading-relaxed text-white/70">
                    Sign in or create a free account first — your trial,
                    payment, and dashboard all live under the same login. No
                    guest checkouts.
                  </p>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                    <Link
                      to="/auth/signup?redirect=/programs/trial"
                      className="inline-flex flex-1 items-center justify-center bg-[#E8192C] px-5 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
                    >
                      Create Account
                    </Link>
                    <Link
                      to="/auth/login?redirect=/programs/trial"
                      className="inline-flex flex-1 items-center justify-center border border-[#1a1a1a] px-5 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/75 transition-colors hover:border-[#E8192C] hover:text-white"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Signed-in user — email/name come straight from auth.
                      No re-entry; we just confirm who's enrolling. */}
                  <div className="border border-[#1a1a1a] bg-black/40 p-4">
                    <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Enrolling as
                    </p>
                    <p className="mt-1 font-['DM_Sans'] text-sm text-white">
                      {name ? `${name} · ` : ""}
                      <span className="text-white/70">{email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const stale: string[] = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (
                              k &&
                              (k.startsWith("sb-") || k.startsWith("brj."))
                            ) {
                              stale.push(k);
                            }
                          }
                          stale.forEach((k) => localStorage.removeItem(k));
                        } catch {
                          // ignore
                        }
                        signOut().catch(() => {});
                        window.location.assign(
                          "/auth/login?redirect=/programs/trial",
                        );
                      }}
                      className="mt-2 inline-block font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35 underline-offset-4 hover:text-white/70 hover:underline"
                    >
                      Not you? Switch account
                    </button>
                  </div>

                  {error && (
                    <div className="border border-[#E8192C]/40 bg-[#E8192C]/10 p-3 text-[13px] text-[#ff6b78]">
                      {error}
                    </div>
                  )}

                  <CrimsonButton
                    size="lg"
                    onClick={startCheckout}
                    disabled={!canEnroll || submitting}
                    fullWidth
                  >
                    {submitting
                      ? "Opening Stripe..."
                      : program
                        ? "ENROLL NOW — $149"
                        : "Pick a track to continue"}
                  </CrimsonButton>

                  <p className="text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
                    Secure checkout via Stripe · 30-day refund window
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-[#1a1a1a] bg-black py-12">
        <div className="mx-auto grid max-w-[1100px] gap-6 px-6 md:grid-cols-3 md:px-10">
          {[
            { icon: Eye, label: "Direct oversight from Ron — every day" },
            { icon: Users, label: "Sean G + Dr. Shelia available post-trial" },
            { icon: LineChart, label: "Daily metrics. Real signal. Reviewed." },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={18} className="text-[#E8192C]" />
              <span className="text-[13px] text-white/65">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[#1a1a1a] py-20">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <div className="mb-10 flex items-center gap-3">
            <span className="h-[1px] w-8 bg-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              FAQ
            </span>
          </div>
          <h2 className="mb-10 font-['Bebas_Neue'] text-5xl leading-none sm:text-6xl">
            QUESTIONS, ANSWERED.
          </h2>
          <FAQAccordion items={FAQ} />
          <div className="mt-12 flex items-center gap-3 border-t border-[#1a1a1a] pt-8 text-[13px] text-white/50">
            <Mail size={16} className="text-[#E8192C]" />
            <span>
              Still have questions? Email{" "}
              <a
                href="mailto:hello@bigronjones.com"
                className="text-white underline underline-offset-4"
              >
                hello@bigronjones.com
              </a>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
