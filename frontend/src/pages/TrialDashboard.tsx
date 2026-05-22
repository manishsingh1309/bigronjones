import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Home,
  Lock,
  PlayCircle,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";
import { useToast } from "@/hooks/useToast";
import { useTrialStatus } from "@/hooks/useTrialStatus";

// ---------------------------------------------------------------------------
// 7-day curriculum. Lesson videos are real YouTube IDs; gym + home workout
// libraries are full YouTube playlists rather than per-day clips.
// ---------------------------------------------------------------------------
type Day = {
  day: number;
  title: string;
  focus: string;
  description: string;
  keyPoints: string[];
  lessonVideoId: string;
};

const PROGRAM: Day[] = [
  {
    day: 1,
    title: "Day 1 — Welcome & The Real-World System",
    focus: "Foundations · Mindset",
    description:
      "Ron lays out the structure of the trial, what to expect each day, and the mental model that makes the next six days actually stick.",
    keyPoints: [
      "Watch today's lesson video in full",
      "Open Day 1 of the Gym or Home workout playlist",
      "Write your Day 1 check-in note to complete the day",
      "Leave your review at the bottom — Ron reads it directly",
    ],
    lessonVideoId: "90-COQ3d0mQ",
  },
  {
    day: 2,
    title: "Day 2 — Cardio That Works For Real Adults",
    focus: "Aerobic Base · Conditioning",
    description:
      "Cardio isn't punishment. Ron breaks down how to dose cardio so it builds you up instead of breaking you down.",
    keyPoints: [
      "Watch the Day 2 lesson",
      "Run today's workout from the Gym or Home playlist",
      "Daily check-in",
      "Drop your honest review — what landed, what didn't",
    ],
    lessonVideoId: "KGiKfgMHgiM",
  },
  {
    day: 3,
    title: "Day 3 — Strength That Sticks",
    focus: "Strength · Movement Quality",
    description:
      "How to add load without wrecking joints. Quality before weight, every set.",
    keyPoints: [
      "Lesson video",
      "Today's strength session from the workout playlist",
      "Daily check-in",
      "Review the day",
    ],
    lessonVideoId: "KwoI0SgTJzY",
  },
  {
    day: 4,
    title: "Day 4 — Recovery & Sleep",
    focus: "Recovery · Sleep",
    description:
      "The day that makes the other days work. Active recovery, breathwork, and the sleep protocol Ron uses with his oversight clients.",
    keyPoints: [
      "Watch today's recovery lesson",
      "Mobility flow from the playlist",
      "Daily check-in (be honest about sleep)",
      "Review — anything you want Ron to see",
    ],
    lessonVideoId: "fGZx__eem7I",
  },
  {
    day: 5,
    title: "Day 5 — Nutrition Basics",
    focus: "Nutrition · Fuel",
    description:
      "Practical nutrition that survives the real world — no perfect meal plans, just the levers that move the needle.",
    keyPoints: [
      "Lesson video",
      "Today's workout session",
      "Daily check-in",
      "Review the day for Ron",
    ],
    lessonVideoId: "1NJgQ5Hz2Yk",
  },
  {
    day: 6,
    title: "Day 6 — Conditioning & Capacity",
    focus: "Conditioning · Work Capacity",
    description:
      "Build the engine between easy cardio and all-out. The gear most adults are missing.",
    keyPoints: [
      "Lesson video",
      "Conditioning workout from the playlist",
      "Daily check-in",
      "Drop your review",
    ],
    lessonVideoId: "M-hR9CDcQng",
  },
  {
    day: 7,
    title: "Day 7 — Review & The Path Forward",
    focus: "Review · Continuation",
    description:
      "Final lesson. Bring your check-ins and reviews to the Day 7 review call — Ron uses them to plan what comes next.",
    keyPoints: [
      "Watch the final lesson",
      "Light movement from the playlist",
      "Submit your final daily check-in",
      "Show up to your Day 7 review call",
    ],
    lessonVideoId: "yTAPv6f8FfU",
  },
];

const GYM_PLAYLIST_ID = "PLbxZT1M57opMuU9QVklq2OLKkC-CQzpgI";
const HOME_PLAYLIST_ID = "PLbxZT1M57opO9ejTUnnhHo0wivaXUqSCq";

type Section = "today" | "modules" | "workouts" | "checkin" | "history";

type CheckIn = {
  trialDay: number;
  feedback: string;
  createdAt?: string;
};

type Review = {
  trialDay: number;
  review: string;
  createdAt?: string;
  updatedAt?: string;
  ronReply?: string | null;
  ronRepliedAt?: string | null;
};

export default function TrialDashboard() {
  const trial = useTrialStatus();
  const push = useToast((s) => s.push);
  const [section, setSection] = useState<Section>("today");
  const [workoutTab, setWorkoutTab] = useState<"gym" | "home">("gym");
  const [userName, setUserName] = useState<string>("");
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewDraft, setReviewDraft] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  // Days the user manually unlocked early by clicking the lock icon. Persisted
  // to localStorage so an unlock survives a refresh. Auto-unlock by date still
  // runs in parallel — the union of the two is what ModuleLadder displays.
  const [manualUnlocks, setManualUnlocks] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("brj.trial.manualUnlocks");
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return new Set();
      return new Set(
        parsed
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7),
      );
    } catch {
      return new Set();
    }
  });
  function unlockDay(day: number) {
    setManualUnlocks((prev) => {
      if (prev.has(day)) return prev;
      const next = new Set(prev).add(day);
      try {
        localStorage.setItem(
          "brj.trial.manualUnlocks",
          JSON.stringify(Array.from(next).sort()),
        );
      } catch {
        // localStorage disabled — non-fatal, in-memory state still works
      }
      return next;
    });
  }

  useEffect(() => {
    document.title = "Your 7-Day Dashboard | BigRonJones®";
  }, []);

  // Pull display name straight from the auth session
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      const meta = (data.user?.user_metadata || {}) as Record<string, unknown>;
      const full =
        (meta.full_name as string) ||
        (meta.name as string) ||
        data.user?.email?.split("@")[0] ||
        "Member";
      setUserName(full);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load past completions (from day_completions via RLS) + Ron-review history.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const headers = await authHeaders();
        const reviewsRes = await fetch("/api/trial-feedback", {
          credentials: "include",
          headers,
        });
        if (!mounted) return;
        if (reviewsRes.ok) {
          const json = (await reviewsRes.json()) as { feedback?: Review[] };
          setReviews(json.feedback || []);
        }

        const { data: rows, error } = await supabase
          .from("day_completions")
          .select("trial_day, feedback_text, completed_at")
          .order("trial_day", { ascending: true });
        if (!mounted) return;
        if (error) {
          console.warn("[trial-dashboard] completions:", error.message);
          return;
        }
        const completions: CheckIn[] = (rows || []).map((r) => ({
          trialDay: Number(r.trial_day),
          feedback: (r.feedback_text as string) || "",
          createdAt: (r.completed_at as string) || undefined,
        }));
        setHistory(completions);
      } catch (err) {
        console.warn("[trial-dashboard] failed to load data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const currentDay = Math.max(1, Math.min(7, trial.trialDay || 1));
  const today = PROGRAM[currentDay - 1];
  const completedDays = useMemo(
    () => new Set(history.map((h) => h.trialDay)),
    [history],
  );
  const completedCount = completedDays.size;
  const checkedInToday = completedDays.has(currentDay);
  const percent = Math.round((completedCount / 7) * 100);

  // When the user navigates between days (or the current day changes), reset
  // the review draft to whatever they last saved for that day. Empty when
  // they haven't written one yet.
  const todaysReview = useMemo(
    () => reviews.find((r) => r.trialDay === currentDay) || null,
    [reviews, currentDay],
  );
  useEffect(() => {
    setReviewDraft(todaysReview?.review || "");
  }, [todaysReview, currentDay]);

  async function submitReview() {
    const review = reviewDraft.trim();
    if (!review) {
      push({
        title: "Review can't be empty",
        description: "Write a few words for Ron before submitting.",
        variant: "error",
      });
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/trial-feedback", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ trialDay: currentDay, review }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      const saved: Review = (json as { feedback?: Review }).feedback || {
        trialDay: currentDay,
        review,
      };
      setReviews((prev) => {
        const next = prev.filter((r) => r.trialDay !== currentDay);
        next.push(saved);
        next.sort((a, b) => a.trialDay - b.trialDay);
        return next;
      });
      push({
        title: `Day ${currentDay} review sent`,
        description: "Ron will read it directly.",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Couldn't save review",
        description: err instanceof Error ? err.message : "Try again",
        variant: "error",
      });
    } finally {
      setSubmittingReview(false);
    }
  }

  async function submitCheckIn(form: CheckInForm) {
    const feedback = form.feedback.trim();
    if (!feedback) {
      push({
        title: "Add a quick note first",
        description: "Tell Ron how today went, even one sentence.",
        variant: "error",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/day-complete", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          trialDay: currentDay,
          feedbackText: feedback,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (res.status === 503 && json.code === "SCHEMA_MIGRATION_REQUIRED") {
          push({
            title: "Database setup incomplete",
            description:
              "Ask the admin to run backend/sql/MIGRATE.sql in Supabase to enable check-ins.",
            variant: "error",
          });
          return;
        }
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      push({
        title: `Day ${currentDay} complete`,
        description:
          currentDay >= 7
            ? "Trial complete — Ron will review your week."
            : `Nice — Day ${currentDay + 1} unlocks tomorrow.`,
        variant: "success",
      });
      setHistory((prev) => [
        {
          trialDay: currentDay,
          feedback,
          createdAt: new Date().toISOString(),
        },
        ...prev.filter((h) => h.trialDay !== currentDay),
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      push({
        title: "Check-in failed",
        description: msg,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] pb-24 pt-28 text-white sm:pt-32">
      {/* Header */}
      <section className="px-6 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
                7-Day Oversight Trial
              </p>
              <h1 className="mt-3 font-['Bebas_Neue'] text-5xl leading-[0.95] sm:text-6xl">
                {userName ? `Welcome back, ${firstName(userName)}.` : "Welcome back."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                You're on{" "}
                <span className="text-white">Day {currentDay} of 7</span>. Open
                today's lesson, run the workout, and submit your check-in. Ron
                reviews every signal.
              </p>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-5 border border-[#1a1a1a] bg-[#0d0d0d] p-5">
              <ProgressRing percent={percent} />
              <div>
                <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/45">
                  Days Logged
                </p>
                <p className="mt-1 font-['Bebas_Neue'] text-4xl leading-none">
                  {completedCount}/7
                </p>
                <p className="mt-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                  {percent}% complete
                </p>
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="mt-10 flex flex-wrap gap-1 border-b border-[#1a1a1a]">
            <TabButton
              active={section === "today"}
              onClick={() => setSection("today")}
              icon={<PlayCircle size={14} />}
              label="Today"
            />
            <TabButton
              active={section === "modules"}
              onClick={() => setSection("modules")}
              icon={<Video size={14} />}
              label="All 7 Days"
            />
            <TabButton
              active={section === "workouts"}
              onClick={() => setSection("workouts")}
              icon={<Dumbbell size={14} />}
              label="Workouts"
            />
            <TabButton
              active={section === "checkin"}
              onClick={() => setSection("checkin")}
              icon={<Activity size={14} />}
              label="Daily Check-In"
            />
            <TabButton
              active={section === "history"}
              onClick={() => setSection("history")}
              icon={<TrendingUp size={14} />}
              label="My Check-Ins"
            />
          </nav>
        </div>
      </section>

      {/* Content */}
      <section className="mt-10 px-6 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          {section === "today" && (
            <TodaySection
              day={today}
              currentDay={currentDay}
              checkedInToday={checkedInToday}
              onJumpToCheckIn={() => setSection("checkin")}
              onJumpToWorkouts={() => setSection("workouts")}
              reviewDraft={reviewDraft}
              onReviewChange={setReviewDraft}
              onReviewSubmit={submitReview}
              submittingReview={submittingReview}
              existingReview={todaysReview}
            />
          )}
          {section === "modules" && (
            <ModuleLadder
              program={PROGRAM}
              currentDay={currentDay}
              completedDays={completedDays}
              manualUnlocks={manualUnlocks}
              onUnlock={unlockDay}
            />
          )}
          {section === "workouts" && (
            <WorkoutsSection
              tab={workoutTab}
              onTabChange={setWorkoutTab}
            />
          )}
          {section === "checkin" && (
            <CheckInSection
              day={today}
              currentDay={currentDay}
              checkedIn={checkedInToday}
              submitting={submitting}
              onSubmit={submitCheckIn}
              existing={
                history.find((h) => h.trialDay === currentDay) || null
              }
            />
          )}
          {section === "history" && <HistorySection history={history} />}
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Subsections
// ---------------------------------------------------------------------------

function TodaySection({
  day,
  currentDay,
  checkedInToday,
  onJumpToCheckIn,
  onJumpToWorkouts,
  reviewDraft,
  onReviewChange,
  onReviewSubmit,
  submittingReview,
  existingReview,
}: {
  day: Day;
  currentDay: number;
  checkedInToday: boolean;
  onJumpToCheckIn: () => void;
  onJumpToWorkouts: () => void;
  reviewDraft: string;
  onReviewChange: (v: string) => void;
  onReviewSubmit: () => void;
  submittingReview: boolean;
  existingReview: Review | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6 md:p-8">
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
          Day {currentDay} · {day.focus}
        </p>
        <h2 className="mt-3 font-['Bebas_Neue'] text-4xl leading-none sm:text-5xl">
          {day.title}
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
          {day.description}
        </p>

        <div className="mt-6">
          <VideoPlayer videoId={day.lessonVideoId} title={day.title} />
        </div>

        <div className="mt-6">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/45">
            Today's session
          </p>
          <ul className="mt-3 grid gap-2">
            {day.keyPoints.map((point) => (
              <li
                key={point}
                className="flex gap-3 border-l-2 border-[#E8192C]/40 bg-black/40 px-4 py-2.5 text-sm text-white/75"
              >
                <span className="text-[#E8192C]">·</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Per-day review — goes straight to Ron's feedback inbox */}
        <div className="mt-8 border-t border-[#1a1a1a] pt-6">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            Your review for Day {currentDay}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/55">
            Drop your honest take after watching the lesson — what landed, what
            didn't, what you want Ron to address. Ron reads every one.
          </p>
          <textarea
            rows={5}
            value={reviewDraft}
            onChange={(e) => onReviewChange(e.target.value)}
            placeholder="What's working? What's hard? Questions for Ron?"
            maxLength={4000}
            className="mt-3 w-full resize-y border border-[#1a1a1a] bg-black px-3 py-3 text-sm leading-relaxed outline-none focus:border-[#E8192C]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
              {existingReview
                ? `Last submitted ${
                    existingReview.updatedAt
                      ? new Date(existingReview.updatedAt).toLocaleString()
                      : "earlier"
                  } · editing replaces`
                : "Not submitted yet"}
            </p>
            <button
              type="button"
              onClick={onReviewSubmit}
              disabled={submittingReview || reviewDraft.trim().length === 0}
              className="inline-flex items-center gap-2 bg-[#E8192C] px-5 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-50"
            >
              {submittingReview
                ? "Sending..."
                : existingReview
                  ? "Update Review"
                  : "Send Review to Ron"}
            </button>
          </div>

          {existingReview?.ronReply && (
            <div className="mt-5 border border-[#E8192C]/30 bg-[#E8192C]/[0.06] p-4">
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
                Reply from Ron
                {existingReview.ronRepliedAt
                  ? ` · ${new Date(existingReview.ronRepliedAt).toLocaleDateString()}`
                  : ""}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/85">
                {existingReview.ronReply}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
            Step 1 · Run your workout
          </p>
          <p className="mt-2 font-['DM_Sans'] text-sm leading-relaxed text-white/70">
            Pick gym or home — both versions are programmed.
          </p>
          <button
            type="button"
            onClick={onJumpToWorkouts}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-[#E8192C] px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
          >
            <Dumbbell size={14} />
            Open Workouts
          </button>
        </div>

        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
            Step 2 · Submit check-in
          </p>
          <p className="mt-2 font-['DM_Sans'] text-sm leading-relaxed text-white/70">
            {checkedInToday
              ? "Today's check-in is logged. You can update the note from the form."
              : "One quick note about your day. Submit to complete Day " +
                currentDay +
                " and unlock the next one."}
          </p>
          <button
            type="button"
            onClick={onJumpToCheckIn}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[#1a1a1a] px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/75 transition-colors hover:border-[#E8192C] hover:text-white"
          >
            <Activity size={14} />
            {checkedInToday ? "View Today's Check-In" : "Daily Check-In"}
          </button>
        </div>

        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
            Need to reach Ron?
          </p>
          <p className="mt-2 font-['DM_Sans'] text-sm leading-relaxed text-white/70">
            Final review call lands on Day 7. Confirm your slot any time.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[#1a1a1a] px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/75 transition-colors hover:border-[#E8192C] hover:text-white"
          >
            <CalendarDays size={14} />
            Message the team
          </Link>
        </div>
      </div>
    </div>
  );
}

function ModuleLadder({
  program,
  currentDay,
  completedDays,
  manualUnlocks,
  onUnlock,
}: {
  program: Day[];
  currentDay: number;
  completedDays: Set<number>;
  manualUnlocks: Set<number>;
  onUnlock: (day: number) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {program.map((day) => {
        // A day is open if the schedule has rolled past it OR the user
        // manually unlocked it by clicking the padlock card.
        const unlocked = day.day <= currentDay || manualUnlocks.has(day.day);
        const completed = completedDays.has(day.day);
        return (
          <div
            key={day.day}
            className={`relative border bg-[#0d0d0d] p-5 ${
              unlocked ? "border-[#1a1a1a]" : "border-[#0f0f0f]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
                Day {day.day}
              </span>
              {completed ? (
                <span className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-['DM_Mono'] text-[9px] uppercase tracking-wider text-emerald-300">
                  <CheckCircle2 size={11} /> Done
                </span>
              ) : unlocked ? (
                <span className="inline-flex items-center gap-1 border border-[#E8192C]/40 bg-[#E8192C]/10 px-2 py-0.5 font-['DM_Mono'] text-[9px] uppercase tracking-wider text-[#E8192C]">
                  <Sparkles size={11} /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 border border-white/10 bg-white/5 px-2 py-0.5 font-['DM_Mono'] text-[9px] uppercase tracking-wider text-white/40">
                  <Lock size={11} /> Locked
                </span>
              )}
            </div>
            <h3 className="mt-3 font-['Bebas_Neue'] text-2xl leading-tight tracking-wide">
              {day.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-white/55">
              {day.description}
            </p>
            <p className="mt-3 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
              {day.focus}
            </p>
            {!unlocked && (
              <button
                type="button"
                onClick={() => onUnlock(day.day)}
                aria-label={`Unlock Day ${day.day}`}
                className="group absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 backdrop-blur-[2px] transition-colors hover:bg-black/50 cursor-pointer"
              >
                <Lock
                  size={22}
                  className="text-white/60 group-hover:text-[#E8192C] transition-colors"
                />
                <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/55 group-hover:text-white">
                  Click to unlock
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WorkoutsSection({
  tab,
  onTabChange,
}: {
  tab: "gym" | "home";
  onTabChange: (t: "gym" | "home") => void;
}) {
  const playlistId = tab === "gym" ? GYM_PLAYLIST_ID : HOME_PLAYLIST_ID;
  const externalHref = `https://www.youtube.com/playlist?list=${playlistId}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onTabChange("gym")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] transition-colors ${
            tab === "gym"
              ? "bg-[#E8192C] text-white"
              : "border border-[#1a1a1a] text-white/65 hover:border-[#E8192C] hover:text-white"
          }`}
        >
          <Dumbbell size={14} />
          Gym Playlist
        </button>
        <button
          type="button"
          onClick={() => onTabChange("home")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] transition-colors ${
            tab === "home"
              ? "bg-[#E8192C] text-white"
              : "border border-[#1a1a1a] text-white/65 hover:border-[#E8192C] hover:text-white"
          }`}
        >
          <Home size={14} />
          Home Playlist
        </button>
        <a
          href={externalHref}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-2 px-3 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45 hover:text-white"
        >
          Open in YouTube ↗
        </a>
      </div>

      <div className="overflow-hidden border border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="aspect-video w-full">
          <iframe
            key={playlistId}
            title={tab === "gym" ? "Gym workout playlist" : "Home workout playlist"}
            src={`https://www.youtube.com/embed/videoseries?list=${playlistId}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-5">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
            {tab === "gym" ? "Gym Workout Playlist" : "Home Workout Playlist"}
          </p>
          <p className="mt-2 font-['DM_Sans'] text-sm leading-relaxed text-white/65">
            {tab === "gym"
              ? "Every gym session for the 7-day trial. Use the playlist controls to jump between days. Built for adults 35+."
              : "Every home / bodyweight session for the 7-day trial. No equipment needed — Ron walks through each day."}
          </p>
        </div>
      </div>
    </div>
  );
}

type CheckInForm = {
  feedback: string;
};

function CheckInSection({
  day,
  currentDay,
  checkedIn,
  submitting,
  onSubmit,
  existing,
}: {
  day: Day;
  currentDay: number;
  checkedIn: boolean;
  submitting: boolean;
  onSubmit: (form: CheckInForm) => void;
  existing: CheckIn | null;
}) {
  const [form, setForm] = useState<CheckInForm>({
    feedback: existing?.feedback || "",
  });

  // If the user already checked in today, prefill the textarea so they can
  // edit instead of starting blank.
  useEffect(() => {
    setForm({ feedback: existing?.feedback || "" });
  }, [existing?.feedback, currentDay]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <form
        onSubmit={handleSubmit}
        className="border border-[#1a1a1a] bg-[#0d0d0d] p-6 md:p-8"
      >
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
          Day {currentDay} · {checkedIn ? "Update Check-In" : "Daily Check-In"}
        </p>
        <h2 className="mt-3 font-['Bebas_Neue'] text-4xl leading-none">
          {day.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          One quick note about your day. Hitting submit marks Day {currentDay}
          {" "}complete and unlocks Day {Math.min(currentDay + 1, 7)}.
        </p>

        <label className="mt-7 block">
          <span className="mb-2 block font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/45">
            How did Day {currentDay} go?
          </span>
          <textarea
            rows={8}
            value={form.feedback}
            onChange={(e) => setForm({ feedback: e.target.value })}
            placeholder="Workout, food, sleep, mood — whatever stood out. Ron reads every one."
            maxLength={4000}
            className="w-full resize-y border border-[#1a1a1a] bg-black px-3 py-3 text-sm leading-relaxed outline-none focus:border-[#E8192C]"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || form.feedback.trim().length === 0}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#E8192C] px-5 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : checkedIn
              ? `Update Day ${currentDay}`
              : `Complete Day ${currentDay}`}
        </button>
      </form>

      <aside className="flex flex-col gap-4">
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            How this works
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/65">
            Each day you watch the lesson, run your workout, and write a quick
            check-in. Submit it to mark the day complete — the next day unlocks
            automatically.
          </p>
        </div>
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            Tip
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-white/65">
            Be honest. A short, real note beats a polished one — Ron uses these
            to calibrate the rest of your week.
          </p>
        </div>
      </aside>
    </div>
  );
}

function HistorySection({ history }: { history: CheckIn[] }) {
  if (history.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6 sm:p-10 text-center">
        <Activity size={28} className="mx-auto text-[#E8192C]/70" />
        <p className="mt-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/45">
          Nothing logged yet
        </p>
        <p className="mt-2 max-w-md mx-auto text-sm text-white/55">
          Submit your first check-in from the Daily Check-In tab. Past entries
          will live here for you and Ron to review.
        </p>
      </div>
    );
  }

  const sorted = [...history].sort((a, b) => a.trialDay - b.trialDay);
  return (
    <div className="grid gap-3">
      {sorted.map((row) => (
        <div
          key={row.trialDay}
          className="border border-[#1a1a1a] bg-[#0d0d0d] p-5"
        >
          <div className="flex items-center gap-3">
            <span className="font-['Bebas_Neue'] text-3xl leading-none text-[#E8192C]">
              D{row.trialDay}
            </span>
            <div className="flex-1">
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45">
                Day {row.trialDay} of 7 · Complete
              </p>
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/35">
                {row.createdAt
                  ? new Date(row.createdAt).toLocaleDateString()
                  : ""}
              </p>
            </div>
          </div>
          {row.feedback && (
            <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-white/75">
              {row.feedback}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function firstName(full: string) {
  return full.trim().split(/\s+/)[0];
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={radius * 2} height={radius * 2} className="-rotate-90">
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        stroke="#1a1a1a"
        strokeWidth={stroke}
        fill="transparent"
      />
      <circle
        cx={radius}
        cy={radius}
        r={normalizedRadius}
        stroke="#E8192C"
        strokeWidth={stroke}
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] transition-colors ${
        active
          ? "border-[#E8192C] text-white"
          : "border-transparent text-white/50 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function VideoPlayer({
  videoId,
  title,
  compact,
}: {
  videoId: string;
  title: string;
  compact?: boolean;
}) {
  if (!videoId) {
    return (
      <div
        className={`flex ${
          compact ? "h-full" : "aspect-video"
        } w-full flex-col items-center justify-center border border-dashed border-[#1a1a1a] bg-[radial-gradient(circle_at_30%_20%,rgba(232,25,44,0.18),rgba(0,0,0,0)_60%),#0a0a0a] text-center`}
      >
        <PlayCircle size={36} className="text-[#E8192C]/70" />
        <p className="mt-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/55">
          Video uploading soon
        </p>
        <p className="mt-1 max-w-xs px-6 text-[12px] leading-relaxed text-white/40">
          {title}
        </p>
      </div>
    );
  }
  return (
    <iframe
      title={title}
      src={`https://www.youtube.com/embed/${videoId}`}
      className="aspect-video h-full w-full"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
