import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  Sparkles,
  Star,
  TrendingUp,
  Video,
} from "lucide-react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";

type Me = {
  user: {
    name?: string;
    trialCompletedAt: string | null;
    priorityWindowExpiresAt: string | null;
  };
};

type PlanId = "full" | "six" | "thirtySix";

type Plan = {
  id: PlanId;
  label: string;
  price: number;
  period: string;
  total: string;
  badge?: string;
  highlight?: boolean;
  description: string;
};

const PLANS: Plan[] = [
  {
    id: "full",
    label: "Pay in Full",
    price: 3000,
    period: "one-time",
    total: "$3,000 total",
    description: "Lock it in. Best long-term value, no monthly admin.",
  },
  {
    id: "six",
    label: "Monthly",
    price: 500,
    period: "per month · 6 months",
    total: "$3,000 total",
    badge: "MOST CHOSEN",
    highlight: true,
    description: "Six-month commitment. Highest signal, balanced cost.",
  },
  {
    id: "thirtySix",
    label: "Extended",
    price: 133,
    period: "per month · 36 months",
    total: "$4,788 total",
    description: "Long arc. Lowest monthly. Built for the patient.",
  },
];

const FEATURE_LIST = [
  "Weekly oversight from Ron",
  "Sean G — nutrition planning",
  "Dr. Shelia — hormone & recovery",
  "Daily tracking continues",
  "Weekly programming adjustments",
];

function fmtCountdown(ms: number): { h: string; m: string; s: string } {
  if (ms <= 0) return { h: "00", m: "00", s: "00" };
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return { h, m, s };
}

export default function ContinuePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<PlanId | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    document.title = "Continue Your Coaching | BigRonJones®";
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const isAuthed = Boolean(data.session?.access_token);
      if (!mounted) return;
      setSignedIn(isAuthed);
      if (!isAuthed) return;
      try {
        const res = await fetch("/api/me", {
          headers: await authHeaders(),
          credentials: "include",
        });
        if (res.status === 401) {
          setSignedIn(false);
          return;
        }
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setMe(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 1-second tick for the live countdown.
  useEffect(() => {
    if (!me?.user.priorityWindowExpiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [me?.user.priorityWindowExpiresAt]);

  const expiresAt = me?.user.priorityWindowExpiresAt
    ? new Date(me.user.priorityWindowExpiresAt).getTime()
    : null;
  const remainingMs = expiresAt ? expiresAt - now : 0;
  const { h, m, s } = useMemo(() => fmtCountdown(remainingMs), [remainingMs]);
  const windowExpired = expiresAt !== null && remainingMs <= 0;

  async function checkout(plan: PlanId) {
    setSubmitting(plan);
    setError("");
    try {
      const price = PLANS.find((p) => p.id === plan)!.price;
      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          checkoutType: "phase2",
          plan,
          total: price,
          items: [
            {
              id: `phase2-${plan}`,
              slug: `phase2-${plan}`,
              name: `BigRonJones Phase 2 — ${PLANS.find((p) => p.id === plan)!.label}`,
              price,
              quantity: 1,
            },
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Checkout failed");
      window.location.assign(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setSubmitting(null);
    }
  }

  if (signedIn === false) {
    return (
      <Shell>
        <Center>
          <Lock size={36} className="mx-auto mb-6 text-[#E8192C]" />
          <h1 className="font-['Bebas_Neue'] text-5xl sm:text-6xl">SIGN IN.</h1>
          <p className="mt-4 text-white/55">
            Sign in to view your continuation options.
          </p>
          <Link
            to="/auth/login?redirect=/continue"
            className="mt-6 inline-flex bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white"
          >
            Sign In
          </Link>
        </Center>
      </Shell>
    );
  }

  if (!me) {
    return (
      <Shell>
        <Center>
          <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-white/55">
            Loading…
          </span>
        </Center>
      </Shell>
    );
  }

  if (!me.user.trialCompletedAt) {
    return (
      <Shell>
        <Center>
          <Clock size={36} className="mx-auto mb-6 text-[#E8192C]" />
          <h1 className="font-['Bebas_Neue'] text-5xl leading-none sm:text-7xl">
            FINISH DAY 7 FIRST.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-white/55">
            The continuation window opens once your final Day 7 check-in is
            logged. Head back to your dashboard to wrap the trial.
          </p>
          <Link
            to="/dashboard"
            className="mt-7 inline-flex bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white"
          >
            Back to Dashboard
          </Link>
        </Center>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="relative overflow-hidden pb-16 pt-28 sm:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(232,25,44,0.18) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1100px] px-6 md:px-10">
          <p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            Step 09 — Continuation
          </p>
          <h1 className="mt-3 font-['Bebas_Neue'] text-5xl leading-[0.95] sm:text-7xl">
            7 DAYS DONE.
            <br />
            WHAT'S NEXT.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/60">
            Ron has reviewed your week of metrics, training, and lessons. The
            180-day program is the next step — Sean G handles nutrition, Dr.
            Shelia handles hormones and recovery. You stay in the system, you
            stay accountable, you keep moving.
          </p>

          {/* Countdown */}
          {expiresAt !== null && (
            <div
              className={
                "mt-10 inline-flex items-center gap-5 border bg-[#0f0f0f] px-6 py-5 " +
                (windowExpired
                  ? "border-[#1a1a1a]"
                  : "border-[#E8192C]")
              }
            >
              <Clock
                size={22}
                className={windowExpired ? "text-white/40" : "text-[#E8192C]"}
              />
              <div>
                <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/45">
                  Priority Enrollment Window
                </p>
                {windowExpired ? (
                  <p className="mt-1 font-['Bebas_Neue'] text-3xl text-white/55">
                    PRIORITY WINDOW CLOSED
                  </p>
                ) : (
                  <p className="mt-1 flex items-baseline gap-1 font-['Bebas_Neue'] text-4xl tracking-wide text-white">
                    <span>{h}</span>
                    <span className="text-[#E8192C]">h</span>
                    <span className="ml-3">{m}</span>
                    <span className="text-[#E8192C]">m</span>
                    <span className="ml-3">{s}</span>
                    <span className="text-[#E8192C]">s</span>
                  </p>
                )}
              </div>
            </div>
          )}
          {windowExpired && (
            <p className="mt-3 max-w-xl text-[13px] text-white/50">
              The priority window has closed, but Ron's team can still help.
              Email{" "}
              <a
                className="text-white underline"
                href="mailto:BigRonJonesLLC@gmail.com"
              >
                BigRonJonesLLC@gmail.com
              </a>{" "}
              and we'll find a path.
            </p>
          )}

          {/* Step 08 — Final Review Call (PDF spec). Book before deciding. */}
          <div className="mt-10 grid gap-5 border border-[#1a1a1a] bg-[#0f0f0f] p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="flex h-12 w-12 items-center justify-center bg-[#E8192C]/[0.12] text-[#E8192C]">
              <Video size={22} />
            </span>
            <div>
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
                Step 08 — Final Review
              </p>
              <p className="mt-1 font-['Bebas_Neue'] text-2xl tracking-wide">
                BOOK YOUR 1:1 WITH RON.
              </p>
              <p className="mt-1 text-[13px] text-white/55">
                Patterns, gaps, strengths — reviewed live before you choose your
                path forward.
              </p>
            </div>
            <a
              href="https://calendly.com/bigronjonesllc/discovery-call?utm_source=trial&utm_campaign=final_review"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#E8192C] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
            >
              Book Final Review →
            </a>
          </div>
        </div>
      </section>

      {/* Tier cards */}
      <section className="border-t border-[#1a1a1a] py-16">
        <div className="mx-auto max-w-[1200px] px-6 md:px-10">
          {error && (
            <div className="mb-6 border border-[#E8192C]/40 bg-[#E8192C]/10 p-4 text-[#ff6b78]">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {PLANS.map((plan) => {
              const isLoading = submitting === plan.id;
              const high = plan.highlight;
              return (
                <div
                  key={plan.id}
                  className={
                    "relative flex flex-col gap-5 border bg-[#0f0f0f] p-7 transition-colors " +
                    (high
                      ? "border-[#E8192C]"
                      : "border-[#1a1a1a] hover:border-[#3a3a3a]")
                  }
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-6 inline-flex items-center gap-1 bg-[#E8192C] px-3 py-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white">
                      <Star size={10} /> {plan.badge}
                    </span>
                  )}
                  <div>
                    <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
                      {plan.label}
                    </span>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-['Bebas_Neue'] text-6xl leading-none">
                        ${plan.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {plan.period}
                    </p>
                    <p className="mt-1 text-[12px] text-white/35">
                      {plan.total}
                    </p>
                  </div>

                  <p className="text-[14px] leading-relaxed text-white/60">
                    {plan.description}
                  </p>

                  <ul className="space-y-2">
                    {FEATURE_LIST.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2 text-[13px] text-white/65"
                      >
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 shrink-0 text-[#E8192C]"
                        />
                        {line}
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={Boolean(submitting)}
                    onClick={() => checkout(plan.id)}
                    className={
                      "mt-auto w-full py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] disabled:opacity-60 " +
                      (high
                        ? "bg-[#E8192C] text-white hover:bg-[#b50f1f]"
                        : "border border-[#E8192C] text-white hover:bg-[#E8192C]")
                    }
                  >
                    {isLoading ? "Opening Stripe…" : `Enroll · ${plan.label}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Outcome strip */}
          <div className="mt-12 grid gap-6 border-t border-[#1a1a1a] pt-10 md:grid-cols-3">
            {[
              { Icon: TrendingUp, label: "Programming adjusted weekly to your data" },
              { Icon: Sparkles, label: "Direct access to Ron, Sean, Dr. Shelia" },
              { Icon: Mail, label: "BigRonJonesLLC@gmail.com — questions welcome" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={18} className="text-[#E8192C]" />
                <span className="text-[13px] text-white/65">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-[#050505] text-white">{children}</main>;
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-6 pt-32 text-center">
      <div className="mx-auto max-w-[680px]">{children}</div>
    </section>
  );
}
