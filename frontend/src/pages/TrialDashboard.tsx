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
      "Rate your six daily metrics to complete the day",
      "Leave a note for Ron at the bottom — he reads it directly",
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
      "Rate your six daily metrics",
      "Drop your honest note — what landed, what didn't",
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
      "Rate your six daily metrics",
      "Note for Ron",
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
      "Rate your six daily metrics (be honest about sleep)",
      "Note for Ron",
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
      "Rate your six daily metrics",
      "Note for Ron",
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
      "Rate your six daily metrics",
      "Drop your note",
    ],
    lessonVideoId: "M-hR9CDcQng",
  },
  {
    day: 7,
    title: "Day 7 — Review & The Path Forward",
    focus: "Review · Continuation",
    description:
      "Final lesson. Bring your metrics and notes to the Day 7 review call — Ron uses them to plan what comes next.",
    keyPoints: [
      "Watch the final lesson",
      "Light movement from the playlist",
      "Submit your final daily metrics",
      "Show up to your Day 7 review call",
    ],
    lessonVideoId: "yTAPv6f8FfU",
  },
];

const GYM_PLAYLIST_ID = "PLbxZT1M57opMuU9QVklq2OLKkC-CQzpgI";
const HOME_PLAYLIST_ID = "PLbxZT1M57opO9ejTUnnhHo0wivaXUqSCq";

type Section = "today" | "modules" | "workouts" | "history";

// The six recovery metrics the user rates 1-5 after each day's lesson. The
// keys map to <name>Rating fields on POST /api/day-complete.
const METRICS = [
  { key: "energy", label: "Energy", hint: "How energized did you feel today?" },
  { key: "mood", label: "Mood", hint: "Your overall mood today" },
  { key: "libido", label: "Libido", hint: "Drive and vitality" },
  {
    key: "performance",
    label: "Performance",
    hint: "How your training session went",
  },
  { key: "sleep", label: "Sleep", hint: "Quality of last night's sleep" },
  {
    key: "rhr",
    label: "RHR",
    hint: "Resting heart rate — how recovered you feel",
  },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];
type Ratings = Record<MetricKey, number>; // 0 = not yet rated

const EMPTY_RATINGS: Ratings = {
  energy: 0,
  mood: 0,
  libido: 0,
  performance: 0,
  sleep: 0,
  rhr: 0,
};

type Completion = {
  trialDay: number;
  ratings: Partial<Ratings>;
  feedback?: string;
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
  const [history, setHistory] = useState<Completion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewDraft, setReviewDraft] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  // Days the user has confirmed they watched this session. The lesson gate is a
  // soft UX step (the hard gate is server-side completion); we keep it in memory
  // so the metrics form only appears once they've watched today's video.
  const [watchedDays, setWatchedDays] = useState<Set<number>>(new Set());

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

        // select("*") keeps this resilient before the metrics migration runs —
        // we read whatever rating columns exist and ignore the rest.
        const { data: rows, error } = await supabase
          .from("day_completions")
          .select("*")
          .order("trial_day", { ascending: true });
        if (!mounted) return;
        if (error) {
          console.warn("[trial-dashboard] completions:", error.message);
          return;
        }
        setHistory((rows || []).map(rowToCompletion));
      } catch (err) {
        console.warn("[trial-dashboard] failed to load data", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const completedDays = useMemo(
    () => new Set(history.map((h) => h.trialDay)),
    [history],
  );
  const completedCount = completedDays.size;

  // Completion-based progression: the current day is the first one not yet
  // completed. Day N+1 is gated on Day N's completion row existing (server
  // enforced) — no calendar/time gating, no localStorage.
  const currentDay = useMemo(() => {
    let d = 1;
    while (d < 7 && completedDays.has(d)) d += 1;
    return d;
  }, [completedDays]);

  const allComplete = completedDays.has(7);
  const today = PROGRAM[currentDay - 1];
  const watchedToday = watchedDays.has(currentDay);
  const checkedInToday = completedDays.has(currentDay);
  const percent = Math.round((completedCount / 7) * 100);

  const todaysReview = useMemo(
    () => reviews.find((r) => r.trialDay === currentDay) || null,
    [reviews, currentDay],
  );
  useEffect(() => {
    setReviewDraft(todaysReview?.review || "");
  }, [todaysReview, currentDay]);

  function markWatched(day: number) {
    setWatchedDays((prev) => {
      if (prev.has(day)) return prev;
      return new Set(prev).add(day);
    });
  }

  async function submitReview() {
    const review = reviewDraft.trim();
    if (!review) {
      push({
        title: "Note can't be empty",
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
        title: `Day ${currentDay} note sent`,
        description: "Ron will read it directly.",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Couldn't save note",
        description: err instanceof Error ? err.message : "Try again",
        variant: "error",
      });
    } finally {
      setSubmittingReview(false);
    }
  }

  async function submitDay(ratings: Ratings) {
    const day = currentDay;
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
          trialDay: day,
          watchedVideo: true,
          energyRating: ratings.energy,
          moodRating: ratings.mood,
          libidoRating: ratings.libido,
          performanceRating: ratings.performance,
          sleepRating: ratings.sleep,
          rhrRating: ratings.rhr,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        trialComplete?: boolean;
      };
      if (!res.ok) {
        if (res.status === 503 && json.code === "SCHEMA_MIGRATION_REQUIRED") {
          push({
            title: "Database setup incomplete",
            description:
              "Ask the admin to run backend/sql/12_trial_daily_metrics.sql in Supabase to enable the check-in form.",
            variant: "error",
          });
          return;
        }
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setHistory((prev) => [
        ...prev.filter((h) => h.trialDay !== day),
        { trialDay: day, ratings, createdAt: new Date().toISOString() },
      ]);
      push({
        title: `Day ${day} complete`,
        description:
          day >= 7
            ? "Trial complete — Ron will review your week."
            : `Locked in. Day ${day + 1} is unlocked.`,
        variant: "success",
      });
      // Drop them back on the Today tab so the next day's lesson is front and
      // centre (or the completion screen on Day 7).
      setSection("today");
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
      <section className="px-5 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
                7-Day Oversight Trial
              </p>
              <h1 className="mt-3 font-['Bebas_Neue'] text-[40px] leading-[0.95] sm:text-6xl">
                {userName
                  ? `Welcome back, ${firstName(userName)}.`
                  : "Welcome back."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                {allComplete ? (
                  "All 7 days logged. Ron is reviewing your week — your continuation window is open."
                ) : (
                  <>
                    You're on{" "}
                    <span className="text-white">Day {currentDay} of 7</span>.
                    Watch today's lesson, then rate your six daily metrics to
                    unlock the next day.
                  </>
                )}
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
              active={section === "history"}
              onClick={() => setSection("history")}
              icon={<TrendingUp size={14} />}
              label="My Check-Ins"
            />
          </nav>
        </div>
      </section>

      {/* Content */}
      <section className="mt-8 px-5 sm:mt-10 sm:px-6 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          {section === "today" &&
            (allComplete ? (
              <TrialCompleteCard trial={trial} />
            ) : (
              <TodaySection
                key={currentDay}
                day={today}
                currentDay={currentDay}
                watched={watchedToday}
                onMarkWatched={() => markWatched(currentDay)}
                onSubmitDay={submitDay}
                submitting={submitting}
                checkedIn={checkedInToday}
                onJumpToWorkouts={() => setSection("workouts")}
                reviewDraft={reviewDraft}
                onReviewChange={setReviewDraft}
                onReviewSubmit={submitReview}
                submittingReview={submittingReview}
                existingReview={todaysReview}
              />
            ))}
          {section === "modules" && (
            <ModuleLadder
              program={PROGRAM}
              currentDay={currentDay}
              completedDays={completedDays}
              onGoToDay={() => setSection("today")}
            />
          )}
          {section === "workouts" && (
            <WorkoutsSection tab={workoutTab} onTabChange={setWorkoutTab} />
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
  watched,
  onMarkWatched,
  onSubmitDay,
  submitting,
  checkedIn,
  onJumpToWorkouts,
  reviewDraft,
  onReviewChange,
  onReviewSubmit,
  submittingReview,
  existingReview,
}: {
  day: Day;
  currentDay: number;
  watched: boolean;
  onMarkWatched: () => void;
  onSubmitDay: (ratings: Ratings) => void;
  submitting: boolean;
  checkedIn: boolean;
  onJumpToWorkouts: () => void;
  reviewDraft: string;
  onReviewChange: (v: string) => void;
  onReviewSubmit: () => void;
  submittingReview: boolean;
  existingReview: Review | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
      <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-5 sm:p-6 md:p-8">
        <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
          Day {currentDay} · {day.focus}
        </p>
        <h2 className="mt-3 font-['Bebas_Neue'] text-3xl leading-none sm:text-4xl md:text-5xl">
          {day.title}
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/65">
          {day.description}
        </p>

        {/* Step 1 — Watch the lesson */}
        <div className="mt-6">
          <StepLabel n={1} label="Watch the lesson" done={watched} />
          <div className="mt-3">
            <VideoPlayer videoId={day.lessonVideoId} title={day.title} />
          </div>
          {!watched && (
            <button
              type="button"
              onClick={onMarkWatched}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-[#E8192C]/50 bg-[#E8192C]/[0.08] px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:border-[#E8192C] hover:bg-[#E8192C]/15 sm:w-auto"
            >
              <CheckCircle2 size={14} />
              I&apos;ve watched today&apos;s lesson
            </button>
          )}
        </div>

        {/* Step 2 — Daily metrics form (revealed once the lesson is watched) */}
        <div className="mt-8 border-t border-[#1a1a1a] pt-6">
          <StepLabel n={2} label="Rate your six daily metrics" done={checkedIn} />
          {!watched ? (
            <div className="mt-4 flex items-center gap-3 border border-dashed border-[#1a1a1a] bg-black/40 px-4 py-5 text-[13px] text-white/45">
              <Lock size={16} className="shrink-0 text-white/40" />
              Watch today&apos;s lesson above to open your daily check-in.
            </div>
          ) : (
            <DailyMetricsForm
              currentDay={currentDay}
              submitting={submitting}
              checkedIn={checkedIn}
              onSubmit={onSubmitDay}
            />
          )}
        </div>

        {/* Optional note straight to Ron's inbox */}
        <div className="mt-8 border-t border-[#1a1a1a] pt-6">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            Anything for Ron? <span className="text-white/40">(optional)</span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-white/55">
            Drop your honest take — what landed, what didn&apos;t, what you want
            Ron to address. He reads every one.
          </p>
          <textarea
            rows={4}
            value={reviewDraft}
            onChange={(e) => onReviewChange(e.target.value)}
            placeholder="What's working? What's hard? Questions for Ron?"
            maxLength={4000}
            className="mt-3 w-full resize-y border border-[#1a1a1a] bg-black px-3 py-3 text-sm leading-relaxed outline-none focus:border-[#E8192C]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
              {existingReview
                ? `Last sent ${
                    existingReview.updatedAt
                      ? new Date(existingReview.updatedAt).toLocaleString()
                      : "earlier"
                  }`
                : "Not sent yet"}
            </p>
            <button
              type="button"
              onClick={onReviewSubmit}
              disabled={submittingReview || reviewDraft.trim().length === 0}
              className="inline-flex items-center gap-2 border border-[#1a1a1a] px-5 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/85 transition-colors hover:border-[#E8192C] hover:text-white disabled:opacity-50"
            >
              {submittingReview
                ? "Sending..."
                : existingReview
                  ? "Update Note"
                  : "Send Note to Ron"}
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

      {/* Sidebar */}
      <div className="flex flex-col gap-4">
        <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-5">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
            Run your workout
          </p>
          <p className="mt-2 font-['DM_Sans'] text-sm leading-relaxed text-white/70">
            Pick gym or home — both versions are programmed for Day {currentDay}.
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
            How this works
          </p>
          <ul className="mt-3 grid gap-2">
            {day.keyPoints.map((point) => (
              <li
                key={point}
                className="flex gap-2.5 text-[13px] leading-relaxed text-white/70"
              >
                <span className="mt-0.5 text-[#E8192C]">·</span>
                {point}
              </li>
            ))}
          </ul>
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

// The six-metric, 1-5 daily check-in. Submitting it completes the day and
// unlocks the next one.
function DailyMetricsForm({
  currentDay,
  submitting,
  checkedIn,
  onSubmit,
}: {
  currentDay: number;
  submitting: boolean;
  checkedIn: boolean;
  onSubmit: (ratings: Ratings) => void;
}) {
  const [ratings, setRatings] = useState<Ratings>(EMPTY_RATINGS);
  const allRated = METRICS.every((m) => ratings[m.key] >= 1);

  function setMetric(key: MetricKey, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRated) return;
    onSubmit(ratings);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <p className="text-[13px] leading-relaxed text-white/55">
        Rate each one from 1 to 5 for today. Submitting marks Day {currentDay}
        {" "}complete and unlocks Day {Math.min(currentDay + 1, 7)}.
      </p>

      <div className="mt-5 grid gap-3">
        {METRICS.map((m) => (
          <RatingRow
            key={m.key}
            label={m.label}
            hint={m.hint}
            value={ratings[m.key]}
            onChange={(v) => setMetric(m.key, v)}
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={submitting || !allRated}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-[#E8192C] px-5 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Saving..."
          : !allRated
            ? "Rate all six to continue"
            : checkedIn
              ? `Update Day ${currentDay}`
              : currentDay >= 7
                ? "Finish the trial"
                : `Complete Day ${currentDay} & unlock Day ${currentDay + 1}`}
      </button>
    </form>
  );
}

function RatingRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="border border-[#1a1a1a] bg-black/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-['Bebas_Neue'] text-xl leading-none tracking-wide text-white">
            {label}
          </p>
          <p className="mt-1 text-[12px] leading-snug text-white/45">{hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = value >= 1 && n <= value;
            const selected = value === n;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${label} ${n} out of 5`}
                aria-pressed={selected}
                onClick={() => onChange(n)}
                className={`flex h-11 w-11 items-center justify-center border font-['Bebas_Neue'] text-2xl leading-none transition-colors sm:h-10 sm:w-10 sm:text-xl ${
                  active
                    ? "border-[#E8192C] bg-[#E8192C] text-white"
                    : "border-[#1f1f1f] bg-[#0d0d0d] text-white/45 hover:border-[#E8192C]/60 hover:text-white"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepLabel({
  n,
  label,
  done,
}: {
  n: number;
  label: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-6 w-6 items-center justify-center border text-[11px] font-bold ${
          done
            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
            : "border-[#E8192C]/50 bg-[#E8192C]/10 text-[#E8192C]"
        } font-['DM_Mono']`}
      >
        {done ? <CheckCircle2 size={13} /> : n}
      </span>
      <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/70">
        {label}
      </span>
    </div>
  );
}

function TrialCompleteCard({ trial }: { trial: ReturnType<typeof useTrialStatus> }) {
  return (
    <div className="border border-[#E8192C]/30 bg-gradient-to-br from-[#E8192C]/[0.08] via-[#0d0d0d] to-[#0d0d0d] p-6 text-center sm:p-12">
      <CheckCircle2 size={40} className="mx-auto text-[#E8192C]" />
      <h2 className="mt-5 font-['Bebas_Neue'] text-4xl leading-none sm:text-6xl">
        SEVEN DAYS DONE.
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
        Every day is logged and your metrics are in front of Ron. Your
        continuation window is open — decide your next step while it&apos;s
        warm.
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/continue"
          className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
        >
          View Continuation →
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/75 transition-colors hover:border-[#E8192C] hover:text-white"
        >
          Message the team
        </Link>
      </div>
    </div>
  );
}

function ModuleLadder({
  program,
  currentDay,
  completedDays,
  onGoToDay,
}: {
  program: Day[];
  currentDay: number;
  completedDays: Set<number>;
  onGoToDay: () => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {program.map((day) => {
        // Completion-based gating: Day 1 is always open; every later day opens
        // only once the previous day is completed.
        const unlocked = day.day === 1 || completedDays.has(day.day - 1);
        const completed = completedDays.has(day.day);
        const isCurrent = day.day === currentDay && !completed;
        return (
          <div
            key={day.day}
            className={`relative border bg-[#0d0d0d] p-5 ${
              unlocked ? "border-[#1a1a1a]" : "border-[#0f0f0f]"
            } ${isCurrent ? "ring-1 ring-[#E8192C]/40" : ""}`}
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
            {isCurrent && (
              <button
                type="button"
                onClick={onGoToDay}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-[#E8192C] px-4 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
              >
                <PlayCircle size={13} /> Continue Day {day.day}
              </button>
            )}
            {!unlocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 backdrop-blur-[2px]">
                <Lock size={22} className="text-white/55" />
                <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/55">
                  Finish Day {day.day - 1} first
                </span>
              </div>
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

function HistorySection({ history }: { history: Completion[] }) {
  if (history.length === 0) {
    return (
      <div className="border border-[#1a1a1a] bg-[#0d0d0d] p-6 text-center sm:p-10">
        <Activity size={28} className="mx-auto text-[#E8192C]/70" />
        <p className="mt-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/45">
          Nothing logged yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
          Complete a day from the Today tab and your daily metrics will live
          here for you and Ron to review.
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
          {hasAnyRating(row.ratings) && (
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {METRICS.map((m) => (
                <div
                  key={m.key}
                  className="border border-[#1a1a1a] bg-black/40 px-2 py-2 text-center"
                >
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.15em] text-white/40">
                    {m.label}
                  </p>
                  <p className="mt-1 font-['Bebas_Neue'] text-2xl leading-none text-white">
                    {row.ratings[m.key] ?? "—"}
                    {row.ratings[m.key] ? (
                      <span className="text-sm text-white/35">/5</span>
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          )}
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

function rowToCompletion(r: Record<string, unknown>): Completion {
  const num = (v: unknown) =>
    typeof v === "number" && v >= 1 && v <= 5 ? v : undefined;
  return {
    trialDay: Number(r.trial_day),
    feedback: (r.feedback_text as string) || undefined,
    createdAt: (r.completed_at as string) || undefined,
    ratings: {
      energy: num(r.energy_rating),
      mood: num(r.mood_rating),
      libido: num(r.libido_rating),
      performance: num(r.performance_rating),
      sleep: num(r.sleep_rating),
      rhr: num(r.rhr_rating),
    },
  };
}

function hasAnyRating(ratings: Partial<Ratings>) {
  return METRICS.some((m) => typeof ratings[m.key] === "number");
}

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
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.18em] transition-colors sm:px-4 sm:text-[11px] sm:tracking-[0.2em] ${
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

function VideoPlayer({ videoId, title }: { videoId: string; title: string }) {
  if (!videoId) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center border border-dashed border-[#1a1a1a] bg-[radial-gradient(circle_at_30%_20%,rgba(232,25,44,0.18),rgba(0,0,0,0)_60%),#0a0a0a] text-center">
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
      className="aspect-video h-full w-full border border-[#1a1a1a]"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
