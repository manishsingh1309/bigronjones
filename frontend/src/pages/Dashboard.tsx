import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Home,
  Key,
  ListChecks,
  Lock,
  MessageSquare,
  PlayCircle,
  ShoppingBag,
  Video,
} from "lucide-react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";
import DayChecklistModal, {
  type DayChecklistPayload,
} from "@/components/trial/DayChecklistModal";
import { MetricScale } from "@/components/trial/MetricScale";

type DashboardData = {
  locked: boolean;
  activeDay: number | null;
  user: {
    id?: string;
    name: string;
    email?: string;
    paymentStatus?: string | null;
    programType?: string | null;
    hasBookedCalendly: boolean;
    bookingCompleted?: boolean;
    bookingTime?: string | null;
    trialStartDate?: string | null;
    trialEndDate?: string | null;
    trialCompletedAt: string | null;
  };
  modules: Array<{
    id: string;
    title: string;
    description: string;
    video_url?: string;
    trial_day: number;
    key_takeaways?: string[];
  }>;
  metrics: Array<{
    id: string;
    metric_date: string;
    trial_day?: number | null;
    sleep_quality: number;
    soreness_level: number;
    energy_level: number;
    mood?: number | null;
    workout_type?: string | null;
  }>;
};

type DayCompletion = {
  id: string;
  trial_day: number;
  watched_video: boolean;
  completed_workout: boolean;
  logged_nutrition: boolean;
  reviewed_notes: boolean;
  energy_rating: number | null;
  difficulty_rating: number | null;
  overall_feeling: string | null;
  feedback_text: string | null;
  ron_reply: string | null;
  ron_replied_at: string | null;
  completed_at: string;
};

const GYM_PLAYLIST =
  "https://www.youtube.com/playlist?list=PLbxZT1M57opMuU9QVklq2OLKkC-CQzpgI";
const HOME_PLAYLIST =
  "https://www.youtube.com/playlist?list=PLbxZT1M57opO9ejTUnnhHo0wivaXUqSCq";

const sliderColor = (n: number) => {
  if (n <= 2) return "#ef4444"; // red
  if (n <= 4) return "#f97316"; // orange
  if (n === 5) return "#eab308"; // yellow
  if (n <= 7) return "#84cc16"; // yellow-green
  return "#22c55e"; // green
};

function youtubeEmbed(url?: string): string | null {
  if (!url) return null;
  if (url.includes("/embed/")) return url;
  // accept full youtube URLs and extract the ID
  const match = url.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
  if (match)
    return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
  return url;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completions, setCompletions] = useState<DayCompletion[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistSubmitting, setChecklistSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // "Keys to Success" onboarding panel (Step 3) — auto-expanded on Day 1,
  // collapsed thereafter. Persisted via localStorage so re-opens are sticky.
  const [keysOpen, setKeysOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem("brj.keysCollapsed");
      return v !== "1";
    } catch {
      return true;
    }
  });
  const [form, setForm] = useState({
    sleepQuality: 7,
    soreness: 3,
    energyLevel: 7,
    mood: 7,
    workoutType: "" as "" | "gym" | "home" | "skipped",
    notes: "",
  });

  useEffect(() => {
    document.title = "Trial Dashboard | BigRonJones®";
  }, []);

  async function loadDashboard() {
    setLoadError("");
    const headers = await authHeaders();
    const hasToken = Boolean((headers as Record<string, string>).Authorization);
    setSignedIn(hasToken);
    setAuthChecked(true);
    if (!hasToken) return;
    const res = await fetch("/api/dashboard", {
      headers,
      credentials: "include",
    });
    if (res.status === 401) {
      setSignedIn(false);
      return;
    }
    if (res.status === 403) {
      setLoadError(
        "Dashboard access requires a paid Stripe purchase and Calendly booking.",
      );
      navigate("/", { replace: true });
      return;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to load dashboard");
    setData(json);
    await loadCompletions(headers);
  }

  // Day completions live in their own table — fetched directly from
  // Supabase via the user's anon session (RLS scopes to auth.uid()).
  async function loadCompletions(headers?: HeadersInit) {
    try {
      const auth = headers ?? (await authHeaders());
      const token = (auth as Record<string, string>).Authorization;
      if (!token) return;
      const { data: rows, error } = await supabase
        .from("day_completions")
        .select(
          "id, trial_day, watched_video, completed_workout, logged_nutrition, reviewed_notes, energy_rating, difficulty_rating, overall_feeling, feedback_text, ron_reply, ron_replied_at, completed_at",
        )
        .order("trial_day", { ascending: true });
      if (error) {
        // Table may not exist yet (migration 05 not run). Don't block the
        // whole dashboard — just log and treat as no completions.
        console.warn("[dashboard] completions fetch:", error.message);
        return;
      }
      setCompletions((rows as DayCompletion[]) || []);
    } catch (err) {
      console.warn("[dashboard] completions error:", err);
    }
  }

  async function submitChecklist(payload: DayChecklistPayload) {
    if (!data?.activeDay) return;
    setChecklistSubmitting(true);
    try {
      const res = await fetch("/api/day-complete", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ ...payload, trialDay: data.activeDay }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit");
      setShowChecklist(false);
      if (json.trialComplete) {
        window.location.assign("/continue");
        return;
      }
      await loadDashboard();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit checklist",
      );
    } finally {
      setChecklistSubmitting(false);
    }
  }

  useEffect(() => {
    loadDashboard().catch((err) =>
      setLoadError(err instanceof Error ? err.message : "Failed to load"),
    );
    // Refresh state if auth changes mid-session
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadDashboard().catch(() => {});
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const currentDay = data?.activeDay ?? 0;
  // The user can browse any day they've reached; defaults to current day.
  const viewDay = selectedDay ?? currentDay;
  const activeDay = viewDay;
  const todayCompletion = useMemo(
    () => completions.find((c) => c.trial_day === viewDay) || null,
    [completions, viewDay],
  );
  // A day counts as "complete" when the user has explicitly marked it done
  // via the checklist (preferred), OR submitted metrics for that day (legacy
  // signal — pre-Phase-1 users). Both produce the crimson-filled progress dot.
  const completedDays = useMemo(() => {
    const set = new Set<number>();
    for (const c of completions) set.add(c.trial_day);
    if (data) {
      for (const m of data.metrics) {
        if (typeof m.trial_day === "number") set.add(m.trial_day);
      }
    }
    return set;
  }, [data, completions]);

  const todaySubmitted = activeDay > 0 && completedDays.has(activeDay);
  const trialOver = data?.user.trialCompletedAt || completedDays.size >= 7;

  const activeModule = useMemo(() => {
    if (!data || !activeDay) return null;
    return data.modules.find((m) => m.trial_day === activeDay) || null;
  }, [data, activeDay]);

  async function submitMetrics(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !activeDay) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/metrics", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          sleepQuality: form.sleepQuality,
          soreness: form.soreness,
          energyLevel: form.energyLevel,
          mood: form.mood,
          workoutType: form.workoutType || undefined,
          notes: form.notes,
          trialDay: activeDay,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit metrics");
      await loadDashboard();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit metrics",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Gates ────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <Shell>
        <Loading label="Loading dashboard…" />
      </Shell>
    );
  }

  if (!signedIn) {
    return (
      <Shell>
        <Gate
          icon={Lock}
          eyebrow="Sign In Required"
          title="ACCESS YOUR TRIAL."
          body="Sign in with the email you used at checkout to unlock your trial dashboard."
          ctaLabel="Sign In"
          ctaHref="/auth/login?redirect=/dashboard"
          secondary={{
            label: "Don't have an account? Sign up",
            href: "/auth/signup?redirect=/dashboard",
          }}
        />
      </Shell>
    );
  }

  if (loadError) {
    return (
      <Shell>
        <ErrorBlock message={loadError} />
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <Loading label="Loading dashboard…" />
      </Shell>
    );
  }

  // Hasn't paid yet — only firing when payment_status is explicitly NOT paid.
  // Paid users without a Calendly booking fall through to the locked
  // dashboard below (Step 1 banner + playlists + locked training modules).
  const isPaid =
    data.user.paymentStatus === "paid" || !!data.user.trialStartDate;
  if (!isPaid) {
    return (
      <Shell>
        <Gate
          icon={ShoppingBag}
          eyebrow="No Active Trial"
          title="START YOUR 7-DAY TRIAL."
          body="You don't have an active trial yet. Enroll for $2 to get your 1:1 discovery call and unlock the dashboard."
          ctaLabel="Enroll for $2"
          ctaHref="/programs/trial"
        />
      </Shell>
    );
  }

  // Paid but trial dates somehow missing (rare — verify-trial-payment should
  // have set them). Fallback shows the legacy locked dashboard so the user
  // isn't dead-ended.
  if (data.locked && !data.user.trialStartDate) {
    const firstName = (data.user.name || "").split(" ")[0] || "MEMBER";
    return (
      <Shell>
        <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-24 md:px-10">
          <DashboardHeader
            firstName={firstName}
            subtitle="Your 7-Day Oversight Dashboard"
          />
          <StepBanner
            icon={Calendar}
            step="Step 1"
            title="Book Your Activation Call"
            body="Your 7-Day Trial will not begin until you complete your kick-off strategy session with Ron."
            ctaLabel="Book Now"
            ctaHref="https://calendly.com/bigronjonesllc/discovery-call"
            ctaExternal
          />
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[280px_1fr]">
            <PlaylistsCard logActivity />
            <TrainingModulesLockedCard />
          </div>
        </div>
      </Shell>
    );
  }

  // All 7 days complete
  if (trialOver) {
    return (
      <Shell>
        <Gate
          icon={CheckCircle2}
          eyebrow="Trial Complete"
          title="7 DAYS DONE. WHAT'S NEXT."
          body="Ron has reviewed your week. The 48-hour priority enrollment window is open."
          ctaLabel="See Continuation Options"
          ctaHref="/continue"
        />
      </Shell>
    );
  }

  // ─── Active dashboard ─────────────────────────────────────────────────
  const firstName = (data.user.name || "").split(" ")[0] || "MEMBER";
  return (
    <Shell>
      <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-24 md:px-10">
        {/* Header — "Welcome back, NAME" + OVERSIGHT MEMBER badge */}
        <DashboardHeader
          firstName={firstName}
          subtitle="Your 7-Day Oversight Dashboard"
        />

        {/* Persistent Step 1 reminder until the activation call is booked. */}
        {!data.user.hasBookedCalendly && (
          <div
            className="mb-6 flex flex-col items-start gap-4 border border-[#E8192C]/30 p-5 md:flex-row md:items-center"
            style={{
              background:
                "linear-gradient(90deg, rgba(232,25,44,0.10) 0%, rgba(232,25,44,0.02) 80%, transparent 100%)",
            }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8192C]/[0.18]">
              <Calendar size={18} className="text-[#E8192C]" />
            </span>
            <div className="flex-1">
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
                Step 1 — Activation Call
              </p>
              <p className="mt-1 font-['DM_Sans'] text-[14px] leading-relaxed text-white/75">
                Book your 1:1 kick-off call with Ron to set baseline + goals.
                Videos and check-ins are open below — book the call when you're
                ready.
              </p>
            </div>
            <a
              href="https://calendly.com/bigronjonesllc/discovery-call"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#E8192C] px-5 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f] md:ml-auto"
            >
              Book Now →
            </a>
          </div>
        )}

        {/* Step banner — "Day N · {module title}" with primary CTA */}
        <ActiveStepBanner
          day={currentDay}
          moduleTitle={
            data.modules.find((m) => m.trial_day === currentDay)?.title ||
            `Day ${currentDay}`
          }
          completed={completedDays.has(currentDay)}
          onMarkComplete={() => {
            setSelectedDay(currentDay);
            setShowChecklist(true);
          }}
          isLastDay={currentDay === 7}
        />

        {/* 7-segment progress + completion count */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/45">
              Progress · {completedDays.size}/7 complete
            </p>
            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/30">
              Trial ends{" "}
              {data.user.trialEndDate
                ? new Date(data.user.trialEndDate).toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" },
                  )
                : "—"}
            </p>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const day = i + 1;
              const done = completedDays.has(day);
              const isToday = day === currentDay;
              return (
                <div
                  key={day}
                  className={
                    "h-2 w-full transition-colors " +
                    (done
                      ? "bg-[#E8192C]"
                      : isToday
                        ? "bg-[#E8192C]/30"
                        : "bg-[#1c1c1c]")
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Keys to Success — Step 3 onboarding (collapsible) */}
        <div className="mb-6 border border-[#1a1a1a] bg-[#0f0f0f]">
          <button
            type="button"
            onClick={() => {
              const next = !keysOpen;
              setKeysOpen(next);
              try {
                localStorage.setItem("brj.keysCollapsed", next ? "0" : "1");
              } catch {
                /* no-op */
              }
            }}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <Key size={16} className="text-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              Keys to Success
            </span>
            <span className="ml-auto text-white/40">
              {keysOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>
          {keysOpen && (
            <div className="grid grid-cols-1 gap-5 border-t border-[#1a1a1a] p-4 sm:p-6 md:grid-cols-3">
              <KeyItem
                num="01"
                title="Watch the Day's Video"
                body="Each day has one short lesson. Watch it before training."
              />
              <KeyItem
                num="02"
                title="Train, Then Log"
                body="Pick gym or home. Hit the workout. Then submit your check-in."
              />
              <KeyItem
                num="03"
                title="Log Every Day"
                body="Ron reviews patterns, not single days. 7 logs = real signal."
              />
            </div>
          )}
        </div>

        {/* MAIN: Playlists (left) + Training Modules day list (right) */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[280px_1fr]">
          <PlaylistsCard logActivity />
          <TrainingModulesUnlockedCard
            modules={data.modules}
            currentDay={currentDay}
            selectedDay={viewDay}
            completedDays={completedDays}
            onSelect={(d) => setSelectedDay(d)}
          />
        </div>

        {/* Selected day video + checklist + metrics */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          {/* Video + module info */}
          <div className="space-y-6">
            <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
                  Day {activeDay} Lesson
                </span>
              </div>
              {activeModule && youtubeEmbed(activeModule.video_url) ? (
                <div
                  className="relative w-full overflow-hidden bg-black"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    title={activeModule.title}
                    src={youtubeEmbed(activeModule.video_url) || ""}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center bg-black text-white/30">
                  Video pending — check back tomorrow
                </div>
              )}
              <h2 className="mt-5 font-['Bebas_Neue'] text-3xl tracking-wide">
                {activeModule?.title || `Day ${activeDay}`}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">
                {activeModule?.description}
              </p>
              {activeModule?.key_takeaways &&
                activeModule.key_takeaways.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {activeModule.key_takeaways.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2 text-[13px] text-white/60"
                      >
                        <CheckCircle2
                          size={14}
                          className="mt-0.5 shrink-0 text-[#E8192C]"
                        />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            {/* Day 7 Final Review CTA — Step 8 of the trial framework */}
            {activeDay === 7 && <FinalReviewBlock />}

            {/* Day completion: checklist + feedback to Ron.
                  Complementary to the daily metrics form on the right. */}
            <DayCompleteBlock
              day={activeDay}
              completion={todayCompletion}
              onOpen={() => setShowChecklist(true)}
            />
          </div>

          {/* Daily check-in form */}
          <aside>
            <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-6">
              <div className="mb-5 flex items-center gap-3">
                <Activity className="text-[#E8192C]" size={18} />
                <h2 className="font-['Bebas_Neue'] text-2xl tracking-wide">
                  Daily Check-In · Day {activeDay}
                </h2>
              </div>

              {todaySubmitted ? (
                <div className="border border-[#E8192C]/40 bg-[#E8192C]/[0.06] p-5 text-center">
                  <CheckCircle2
                    size={32}
                    className="mx-auto mb-3 text-[#E8192C]"
                  />
                  <p className="font-['Bebas_Neue'] text-2xl">
                    DAY {activeDay} LOGGED.
                  </p>
                  <p className="mt-1 text-[13px] text-white/55">
                    Ron has your data. See you tomorrow.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitMetrics} className="space-y-5">
                  <MetricScale
                    label="Sleep Quality"
                    lowLabel="Terrible"
                    highLabel="Amazing"
                    value={form.sleepQuality}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, sleepQuality: v }))
                    }
                  />
                  <MetricScale
                    label="Soreness"
                    lowLabel="None"
                    highLabel="Very Sore"
                    allowZero
                    value={form.soreness}
                    onChange={(v) => setForm((f) => ({ ...f, soreness: v }))}
                  />
                  <MetricScale
                    label="Energy Level"
                    lowLabel="Exhausted"
                    highLabel="Energized"
                    value={form.energyLevel}
                    onChange={(v) => setForm((f) => ({ ...f, energyLevel: v }))}
                  />
                  <MetricScale
                    label="Mood"
                    lowLabel="Low"
                    highLabel="Great"
                    value={form.mood}
                    onChange={(v) => setForm((f) => ({ ...f, mood: v }))}
                  />

                  <div>
                    <span className="mb-2 block font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45">
                      Workout
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "gym" as const, label: "Gym", Icon: Dumbbell },
                        { id: "home" as const, label: "Home", Icon: Home },
                        {
                          id: "skipped" as const,
                          label: "Skipped",
                          Icon: Clock,
                        },
                      ].map(({ id, label, Icon }) => {
                        const sel = form.workoutType === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                workoutType: sel ? "" : id,
                              }))
                            }
                            className={
                              "flex flex-col items-center gap-1 border px-2 py-3 text-[11px] uppercase tracking-[0.18em] transition-colors " +
                              (sel
                                ? "border-[#E8192C] bg-[#E8192C]/[0.07] text-white"
                                : "border-[#1a1a1a] bg-black text-white/55 hover:border-[#3a3a3a]")
                            }
                          >
                            <Icon size={16} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Notes for Ron's team (optional)"
                    className="min-h-24 w-full border border-[#1a1a1a] bg-black p-3 text-[13px] outline-none focus:border-[#E8192C]"
                  />

                  {submitError && (
                    <div className="border border-[#E8192C]/40 bg-[#E8192C]/10 p-3 text-[13px] text-[#ff6b78]">
                      {submitError}
                    </div>
                  )}

                  <button
                    disabled={submitting}
                    className="w-full bg-[#E8192C] py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f] disabled:opacity-60"
                  >
                    {submitting
                      ? "Submitting…"
                      : `Submit Day ${activeDay} Check-In →`}
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Day-completion checklist modal */}
      <AnimatePresence>
        {showChecklist && activeDay > 0 && (
          <DayChecklistModal
            day={activeDay}
            submitting={checklistSubmitting}
            onSubmit={submitChecklist}
            onClose={() => setShowChecklist(false)}
          />
        )}
      </AnimatePresence>
    </Shell>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-[#050505] text-white">
      {children}
    </section>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="mx-auto flex max-w-[600px] items-center justify-center px-6 pt-40">
      <div className="flex items-center gap-3 text-white/55">
        <span className="h-3 w-3 animate-pulse rounded-full bg-[#E8192C]" />
        <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em]">
          {label}
        </span>
      </div>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-[600px] px-6 pt-32">
      <div className="border border-[#E8192C]/40 bg-[#E8192C]/10 p-5 text-[#ff6b78]">
        {message}
      </div>
    </div>
  );
}

function Gate({
  icon: Icon,
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  ctaExternal,
  secondary,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
  secondary?:
    | { label: string; href: string; onClick?: never }
    | { label: string; onClick: () => void; href?: never };
}) {
  const cta = ctaExternal ? (
    <a
      href={ctaHref}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white"
    >
      {ctaLabel}
    </a>
  ) : (
    <Link
      to={ctaHref}
      className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white"
    >
      {ctaLabel}
    </Link>
  );
  return (
    <div className="mx-auto max-w-[680px] px-6 pt-32 text-center">
      <Icon size={36} className="mx-auto mb-6 text-[#E8192C]" />
      <p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
        {eyebrow}
      </p>
      <h1 className="mt-3 font-['Bebas_Neue'] text-5xl leading-none sm:text-7xl">
        {title}
      </h1>
      <p className="mx-auto mt-5 max-w-md text-[14px] leading-relaxed text-white/55">
        {body}
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        {cta}
        {secondary && "href" in secondary && secondary.href ? (
          <Link
            to={secondary.href}
            className="text-[13px] text-white/55 underline underline-offset-4 hover:text-white"
          >
            {secondary.label}
          </Link>
        ) : secondary ? (
          <button
            onClick={secondary.onClick}
            className="text-[13px] text-white/55 underline underline-offset-4 hover:text-white"
          >
            {secondary.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProgressTab({
  modules,
  metrics,
  activeDay,
}: {
  modules: DashboardData["modules"];
  metrics: DashboardData["metrics"];
  activeDay: number;
}) {
  const byDay = new Map(
    metrics
      .filter((m) => typeof m.trial_day === "number")
      .map((m) => [m.trial_day as number, m]),
  );
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
        const m = byDay.get(day);
        const mod = modules.find((x) => x.trial_day === day);
        const isToday = day === activeDay;
        const isFuture = day > activeDay;
        const isPastMissed = !m && !isFuture && !isToday;
        return (
          <div
            key={day}
            className={
              "flex flex-col gap-3 border bg-[#0f0f0f] p-5 md:flex-row md:items-center md:justify-between " +
              (m
                ? "border-[#E8192C]/30"
                : isToday
                  ? "border-[#E8192C]"
                  : isPastMissed
                    ? "border-[#ef4444]/40"
                    : "border-[#1a1a1a]")
            }
          >
            <div className="flex items-center gap-4">
              <div
                className={
                  "flex h-10 w-10 items-center justify-center text-sm font-['Bebas_Neue'] " +
                  (m
                    ? "bg-[#E8192C] text-white"
                    : isToday
                      ? "border-2 border-[#E8192C] text-[#E8192C]"
                      : "border border-[#2a2a2a] text-white/45")
                }
              >
                {m ? <CheckCircle2 size={18} /> : day}
              </div>
              <div>
                <p className="font-['Bebas_Neue'] text-xl tracking-wide">
                  {mod?.title || `Day ${day}`}
                </p>
                <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45">
                  {m
                    ? "Logged"
                    : isToday
                      ? "Today"
                      : isFuture
                        ? "Upcoming"
                        : "Missed"}
                </p>
              </div>
            </div>
            {m ? (
              <div className="flex flex-wrap gap-3 text-[12px] text-white/65 md:gap-6">
                <Stat label="Sleep" value={m.sleep_quality} />
                <Stat label="Soreness" value={m.soreness_level} />
                <Stat label="Energy" value={m.energy_level} />
                {typeof m.mood === "number" && (
                  <Stat label="Mood" value={m.mood} />
                )}
              </div>
            ) : (
              <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
                {isFuture ? "Locked until day starts" : "—"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-start">
      <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>
      <span
        className="font-['Bebas_Neue'] text-xl tracking-wide"
        style={{ color: sliderColor(value) }}
      >
        {value}
        <span className="text-[10px] text-white/40">/10</span>
      </span>
    </div>
  );
}

function KeyItem({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-['Bebas_Neue'] text-3xl text-[#E8192C]">
          {num}
        </span>
        <span className="font-['Bebas_Neue'] text-xl tracking-wide text-white">
          {title}
        </span>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-white/55">{body}</p>
    </div>
  );
}

function DayCompleteBlock({
  day,
  completion,
  onOpen,
}: {
  day: number;
  completion: DayCompletion | null;
  onOpen: () => void;
}) {
  if (completion) {
    const checks = [
      ["Watched video", completion.watched_video],
      ["Completed workout", completion.completed_workout],
      ["Stayed on nutrition", completion.logged_nutrition],
      ["Reviewed notes", completion.reviewed_notes],
    ] as const;
    const checkedCount = checks.filter(([, v]) => v).length;
    return (
      <div className="mt-6 border border-[#E8192C]/40 bg-[#E8192C]/[0.05] p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-[#E8192C]" />
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            Day {day} — Marked Complete
          </p>
        </div>
        <p className="mt-3 font-['Bebas_Neue'] text-2xl tracking-wide">
          {checkedCount}/{checks.length} CHECKLIST · FEELING{" "}
          <span className="text-[#E8192C]">
            {completion.overall_feeling?.toUpperCase() || "—"}
          </span>
        </p>
        {completion.feedback_text && (
          <div className="mt-4 border-l-2 border-[#E8192C]/40 pl-4">
            <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/40">
              Your message to Ron
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-white/75">
              "{completion.feedback_text}"
            </p>
          </div>
        )}
        {completion.ron_reply && (
          <div className="mt-4 border border-[#E8192C]/30 bg-[#E8192C]/10 p-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={13} className="text-[#E8192C]" />
              <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-[#E8192C]">
                Ron Replied
                {completion.ron_replied_at &&
                  " · " +
                    new Date(completion.ron_replied_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
              </p>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-white">
              {completion.ron_reply}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onOpen}
          className="mt-5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45 hover:text-white"
        >
          Edit today's checklist →
        </button>
      </div>
    );
  }
  return (
    <div className="mt-6 border border-[#1a1a1a] bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-2">
        <ListChecks size={16} className="text-[#E8192C]" />
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
          End of Day {day} — Checklist
        </p>
      </div>
      <h3 className="mt-3 font-['Bebas_Neue'] text-3xl tracking-wide">
        FINISHED THE DAY?
      </h3>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-white/60">
        Mark Day {day} complete, rate the day, and send Ron a quick note. He
        reviews every message on his admin dashboard.
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex items-center gap-2 bg-[#E8192C] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
      >
        <CheckCircle2 size={14} /> Mark Day {day} Complete →
      </button>
    </div>
  );
}

function DashboardHeader({
  firstName,
  subtitle,
}: {
  firstName: string;
  subtitle: string;
}) {
  return (
    <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1
          className="font-['Bebas_Neue'] leading-[0.95] tracking-wide text-white"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
        >
          WELCOME BACK,{" "}
          <span className="text-[#E8192C]">{firstName.toUpperCase()}</span>
        </h1>
        <p className="mt-2 font-['DM_Sans'] text-[14px] text-white/45">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-3 border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[#E8192C] shadow-[0_0_8px_#E8192C]" />
        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/70">
          Oversight Member
        </span>
      </div>
    </header>
  );
}

function StepBanner({
  icon: Icon,
  step,
  title,
  body,
  ctaLabel,
  ctaHref,
  ctaExternal,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  step: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  ctaExternal?: boolean;
}) {
  const cta = ctaExternal ? (
    <a
      href={ctaHref}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 bg-[#E8192C] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
    >
      {ctaLabel}
    </a>
  ) : (
    <Link
      to={ctaHref}
      className="inline-flex items-center gap-2 bg-[#E8192C] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
    >
      {ctaLabel}
    </Link>
  );
  return (
    <div
      className="mb-6 flex flex-col items-start gap-5 border border-[#E8192C]/40 p-6 md:flex-row md:items-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(232,25,44,0.18) 0%, rgba(232,25,44,0.04) 60%, transparent 100%)",
      }}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8192C]">
        <Icon size={20} className="text-white" />
      </span>
      <div className="flex-1">
        <p className="mb-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
          {step}
        </p>
        <h2 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
          {title}
        </h2>
        <p className="mt-1 font-['DM_Sans'] text-[13px] leading-relaxed text-white/60">
          {body}
        </p>
      </div>
      <div className="md:ml-auto">{cta}</div>
    </div>
  );
}

function ActiveStepBanner({
  day,
  moduleTitle,
  completed,
  onMarkComplete,
  isLastDay,
}: {
  day: number;
  moduleTitle: string;
  completed: boolean;
  onMarkComplete: () => void;
  isLastDay: boolean;
}) {
  if (completed) {
    return (
      <div
        className="mb-6 flex flex-col items-start gap-5 border border-[#E8192C]/40 p-6 md:flex-row md:items-center"
        style={{
          background:
            "linear-gradient(135deg, rgba(232,25,44,0.14) 0%, rgba(232,25,44,0.02) 100%)",
        }}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8192C]">
          <CheckCircle2 size={22} className="text-white" />
        </span>
        <div className="flex-1">
          <p className="mb-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            Day {day} Complete
          </p>
          <h2 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
            {isLastDay ? "TRIAL COMPLETE" : `COME BACK FOR DAY ${day + 1}`}
          </h2>
          <p className="mt-1 font-['DM_Sans'] text-[13px] leading-relaxed text-white/60">
            {isLastDay
              ? "Your continuation window is open."
              : "Tomorrow's lesson unlocks at midnight."}
          </p>
        </div>
        {isLastDay && (
          <Link
            to="/continue"
            className="inline-flex items-center gap-2 bg-[#E8192C] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
          >
            View Continuation →
          </Link>
        )}
      </div>
    );
  }
  return (
    <div
      className="mb-6 flex flex-col items-start gap-5 border border-[#E8192C]/40 p-6 md:flex-row md:items-center"
      style={{
        background:
          "linear-gradient(135deg, rgba(232,25,44,0.18) 0%, rgba(232,25,44,0.04) 60%, transparent 100%)",
      }}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8192C]">
        <PlayCircle size={22} className="text-white" />
      </span>
      <div className="flex-1">
        <p className="mb-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
          Day {day} of 7 · Today
        </p>
        <h2 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
          {moduleTitle.toUpperCase()}
        </h2>
        <p className="mt-1 font-['DM_Sans'] text-[13px] leading-relaxed text-white/60">
          Watch today's lesson, complete your workout, then mark Day {day}{" "}
          complete to send Ron your update.
        </p>
      </div>
      <button
        type="button"
        onClick={onMarkComplete}
        className="inline-flex items-center gap-2 bg-[#E8192C] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f] md:ml-auto"
      >
        <CheckCircle2 size={14} /> Mark Day {day} Complete
      </button>
    </div>
  );
}

const PLAYLIST_LIST = [
  {
    label: "Home Workout",
    sub: "No equipment needed",
    href: HOME_PLAYLIST,
    icon: Home,
  },
  {
    label: "Gym Workout",
    sub: "Full gym programming",
    href: GYM_PLAYLIST,
    icon: Dumbbell,
  },
] as const;

function PlaylistsCard({ logActivity = false }: { logActivity?: boolean }) {
  async function ping(label: string) {
    if (!logActivity) return;
    try {
      const headers = await authHeaders();
      await fetch("/api/log-activity", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          activity_type: "playlist_opened",
          metadata: { type: label },
        }),
      });
    } catch {
      /* fire-and-forget */
    }
  }
  return (
    <div className="overflow-hidden border border-[#1c1c1c] bg-[#0d0d0d]">
      <div className="flex items-center gap-2 border-b border-[#1c1c1c] px-5 py-4">
        <Dumbbell size={14} className="text-[#E8192C]" />
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/55">
          Workout Playlists
        </p>
      </div>
      {PLAYLIST_LIST.map(({ label, sub, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={() => ping(label)}
          className="group flex items-center justify-between gap-3 border-b border-[#1c1c1c] px-5 py-4 transition-colors last:border-b-0 hover:bg-[#161616]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#E8192C]/[0.12] text-[#E8192C]">
              <Icon size={16} />
            </span>
            <div>
              <p className="font-['DM_Sans'] text-sm font-medium text-white">
                {label}
              </p>
              <p className="font-['DM_Mono'] text-[9px] uppercase tracking-wider text-white/35">
                {sub}
              </p>
            </div>
          </div>
          <PlayCircle
            size={15}
            className="text-[#E8192C] opacity-0 transition-opacity group-hover:opacity-100"
          />
        </a>
      ))}
    </div>
  );
}

function TrainingModulesLockedCard() {
  return (
    <div className="overflow-hidden border border-[#1c1c1c] bg-[#0d0d0d]">
      <div className="flex items-center gap-2 border-b border-[#1c1c1c] px-5 py-4">
        <PlayCircle size={14} className="text-[#E8192C]" />
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/55">
          Training Modules
        </p>
      </div>
      <div className="px-6 py-12 text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#1c1c1c]">
          <Lock size={26} className="text-white/30" />
        </span>
        <p className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">
          TRIAL LOCKED
        </p>
        <p className="mx-auto mt-3 max-w-sm font-['DM_Sans'] text-[13px] leading-relaxed text-white/55">
          Book your activation call to unlock the 7-day trial and your training
          modules.
        </p>
        <a
          href="https://calendly.com/bigronjonesllc/discovery-call"
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 bg-[#E8192C] px-7 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
        >
          <Calendar size={14} /> Book Activation Call
        </a>
      </div>
    </div>
  );
}

function TrainingModulesUnlockedCard({
  modules,
  currentDay,
  selectedDay,
  completedDays,
  onSelect,
}: {
  modules: DashboardData["modules"];
  currentDay: number;
  selectedDay: number;
  completedDays: Set<number>;
  onSelect: (day: number) => void;
}) {
  return (
    <div className="overflow-hidden border border-[#1c1c1c] bg-[#0d0d0d]">
      <div className="flex items-center gap-2 border-b border-[#1c1c1c] px-5 py-4">
        <PlayCircle size={14} className="text-[#E8192C]" />
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/55">
          Training Modules
        </p>
        <span className="ml-auto font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
          Day {currentDay} unlocked
        </span>
      </div>
      <ul>
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const mod = modules.find((m) => m.trial_day === day);
          const done = completedDays.has(day);
          const locked = day > currentDay;
          const sel = day === selectedDay;
          return (
            <li key={day} className="border-b border-[#1c1c1c] last:border-b-0">
              <button
                type="button"
                onClick={() => !locked && onSelect(day)}
                disabled={locked}
                className={
                  "flex w-full items-center gap-4 px-5 py-4 text-left transition-all " +
                  (sel
                    ? "border-l-2 border-l-[#E8192C] bg-[#E8192C]/[0.07]"
                    : "border-l-2 border-l-transparent ") +
                  (locked
                    ? " cursor-not-allowed opacity-40"
                    : " cursor-pointer hover:bg-[#161616]")
                }
              >
                <span
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold " +
                    (done
                      ? "bg-[#E8192C] text-white"
                      : sel
                        ? "border-2 border-[#E8192C] text-[#E8192C]"
                        : day === currentDay
                          ? "border-2 border-[#E8192C]/50 text-[#E8192C]"
                          : "border border-[#2a2a2a] text-white/40")
                  }
                >
                  {done ? "✓" : locked ? <Lock size={11} /> : day}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      "truncate font-['DM_Sans'] text-sm " +
                      (locked ? "text-white/35" : "text-white")
                    }
                  >
                    {mod?.title || `Day ${day}`}
                  </p>
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
                    Day {day}
                    {day === currentDay && " · Today"}
                    {done && " · Complete"}
                    {locked && " · Locked"}
                  </p>
                </div>
                {!locked && (
                  <PlayCircle
                    size={14}
                    className={sel ? "text-[#E8192C]" : "text-white/35"}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FinalReviewBlock() {
  return (
    <div className="mt-6 border border-[#E8192C] bg-gradient-to-br from-[#E8192C]/[0.10] to-transparent p-6">
      <div className="flex items-center gap-3">
        <Video size={20} className="text-[#E8192C]" />
        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
          Step 08 — Final Review Call
        </span>
      </div>
      <h3 className="mt-3 font-['Bebas_Neue'] text-3xl tracking-wide">
        BOOK YOUR DAY 7 REVIEW WITH RON.
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-white/60">
        This is the 1:1 where Ron reviews your week — patterns, gaps, strengths.
        Where clarity is delivered. Book it before submitting today's check-in.
      </p>
      <a
        href="https://calendly.com/bigronjonesllc/discovery-call?utm_source=trial&utm_campaign=final_review"
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 bg-[#E8192C] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
      >
        Book Final Review →
      </a>
    </div>
  );
}

function PlaylistCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-7 transition-colors hover:border-[#E8192C]/60"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center bg-[#E8192C]/[0.07] text-[#E8192C]">
          <Icon size={22} />
        </span>
        <Flame size={16} className="ml-auto text-[#E8192C]/60" />
      </div>
      <h3 className="font-['Bebas_Neue'] text-3xl tracking-wide">{title}</h3>
      <p className="text-[14px] leading-relaxed text-white/55">{body}</p>
      <span className="mt-auto font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45 group-hover:text-white">
        Open in YouTube →
      </span>
    </a>
  );
}
