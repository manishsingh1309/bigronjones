import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  CirclePlay,
  Lock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import DashboardShell from "@/features/premium-dashboard/components/DashboardShell";
import SectionCard from "@/features/premium-dashboard/components/SectionCard";
import TrendChartCard from "@/features/premium-dashboard/components/TrendChartCard";
import { usePremiumDashboardStore } from "@/features/premium-dashboard/store";

type FeedbackState = {
  mood: number;
  energy: number;
  understandingLevel: number;
  takeaway: string;
  struggles: string;
  questions: string;
  commitmentScore: number;
  notes: string;
};

function progressRing(percent: number) {
  const radius = 54;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  return { radius, stroke, normalizedRadius, circumference, strokeDashoffset };
}

function ModuleBadge({
  unlocked,
  completed,
}: {
  unlocked: boolean;
  completed: boolean;
}) {
  if (completed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#f5d77b]/25 bg-[#f5d77b]/12 px-3 py-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-[#f5d77b]">
        <CheckCircle2 size={12} /> Completed
      </span>
    );
  }

  if (!unlocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/45">
        <Lock size={12} /> Locked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#f5d77b]/25 bg-white/5 px-3 py-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-[#f5d77b]">
      <CirclePlay size={12} /> Ready
    </span>
  );
}

export default function PremiumDashboardPage() {
  const {
    summary,
    loading,
    error,
    refresh,
    markVideoProgress,
    submitFeedback,
  } = usePremiumDashboardStore();
  const push = useToast((state) => state.push);
  const [selectedDay, setSelectedDay] = useState(1);
  const [markingDay, setMarkingDay] = useState<number | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    mood: 7,
    energy: 7,
    understandingLevel: 7,
    takeaway: "",
    struggles: "",
    questions: "",
    commitmentScore: 8,
    notes: "",
  });

  useEffect(() => {
    document.title = "7-Day Coaching Dashboard | BigRonJones®";
    refresh();
  }, [refresh]);

  const modules = summary.modules || [];
  const selectedModule =
    modules.find((module) => module.day_number === selectedDay) || modules[0];
  const completedCount = summary.completedDays?.length || 0;
  const unlockedCount = modules.filter((module) => module.unlocked).length;
  const ring = progressRing(summary.completionPercent);

  useEffect(() => {
    if (!selectedModule && modules.length > 0) {
      const firstUnlocked =
        modules.find((module) => module.unlocked) || modules[0];
      setSelectedDay(firstUnlocked.day_number);
    }
  }, [modules, selectedModule]);

  useEffect(() => {
    if (!selectedModule) return;
    const existing = summary.dailyFeedback?.find(
      (item) => item.day_number === selectedModule.day_number,
    );
    if (existing) {
      setFeedback({
        mood: existing.mood,
        energy: existing.energy,
        understandingLevel: existing.understanding_level,
        takeaway: existing.takeaway || "",
        struggles: existing.struggles || "",
        questions: existing.questions || "",
        commitmentScore: existing.commitment_score,
        notes: existing.notes || "",
      });
    }
  }, [selectedModule, summary.dailyFeedback]);

  const feedbackSubmitted = useMemo(() => {
    return summary.dailyFeedback?.some(
      (item) => item.day_number === selectedModule?.day_number,
    );
  }, [summary.dailyFeedback, selectedModule]);

  async function handleMarkWatched() {
    if (!selectedModule) return;
    setMarkingDay(selectedModule.day_number);
    try {
      await markVideoProgress({
        dayNumber: selectedModule.day_number,
        watched: true,
      });
      push({
        title: `Day ${selectedModule.day_number} marked watched`,
        description: "The day can now be completed.",
        variant: "success",
      });
      await refresh();
    } finally {
      setMarkingDay(null);
    }
  }

  async function handleMarkCompleted() {
    if (!selectedModule) return;
    setMarkingDay(selectedModule.day_number);
    try {
      await markVideoProgress({
        dayNumber: selectedModule.day_number,
        watched: true,
        completed: true,
      });
      push({
        title: `Day ${selectedModule.day_number} completed`,
        description: "Feedback is now required to unlock the next day.",
        variant: "success",
      });
      await refresh();
    } finally {
      setMarkingDay(null);
    }
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModule) return;
    setSubmittingFeedback(true);
    try {
      await submitFeedback({
        dayNumber: selectedModule.day_number,
        mood: feedback.mood,
        energy: feedback.energy,
        understandingLevel: feedback.understandingLevel,
        takeaway: feedback.takeaway.trim() || undefined,
        struggles: feedback.struggles.trim() || undefined,
        questions: feedback.questions.trim() || undefined,
        commitmentScore: feedback.commitmentScore,
        notes: feedback.notes.trim() || undefined,
      });
      push({
        title: `Feedback saved for Day ${selectedModule.day_number}`,
        description:
          "The next day unlocks automatically when this day is complete.",
        variant: "success",
      });
      await refresh();
    } finally {
      setSubmittingFeedback(false);
    }
  }

  return (
    <DashboardShell userName={summary.user.name} role={summary.user.role}>
      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-[#2a2417] bg-black/35">
          <div className="text-center">
            <Loader2
              className="mx-auto animate-spin text-[#f5d77b]"
              size={30}
            />
            <p className="mt-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.28em] text-white/45">
              Loading 7-day coaching dashboard...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-[#f5d77b]/25 bg-[#f5d77b]/10 p-4 text-sm text-white/80">
          {error}
        </div>
      ) : (
        <div className="space-y-6 text-white">
          <section
            id="overview"
            className="grid gap-6 rounded-4xl border border-[#2a2417] bg-[linear-gradient(135deg,rgba(245,215,123,0.14),rgba(8,8,8,0.98))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)] lg:grid-cols-[1.15fr_0.85fr] lg:p-8"
          >
            <div>
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#f5d77b]/75">
                7-day coaching progression
              </p>
              <h1 className="mt-3 font-['Bebas_Neue'] text-5xl leading-none tracking-[0.08em] md:text-7xl">
                Locked video ladder
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
                Complete the current day video, submit mandatory feedback, and
                the next day unlocks automatically.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat
                  label="Current day"
                  value={`Day ${summary.currentDay || summary.activeDay}`}
                />
                <Stat label="Completed" value={`${completedCount}/7`} />
                <Stat label="Unlocked" value={`${unlockedCount}/7`} />
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative h-44 w-44">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 120 120"
                  className="-rotate-90"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r={ring.normalizedRadius}
                    stroke="#2a2417"
                    strokeWidth={ring.stroke}
                    fill="transparent"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r={ring.normalizedRadius}
                    stroke="#f5d77b"
                    strokeWidth={ring.stroke}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={`${ring.circumference} ${ring.circumference}`}
                    strokeDashoffset={ring.strokeDashoffset}
                    initial={{ strokeDashoffset: ring.circumference }}
                    animate={{ strokeDashoffset: ring.strokeDashoffset }}
                    transition={{ duration: 0.8 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.3em] text-white/45">
                    Progress
                  </p>
                  <p className="font-['Bebas_Neue'] text-6xl leading-none text-white">
                    {summary.completionPercent}%
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {completedCount} days complete
                  </p>
                </div>
              </div>
            </div>
          </section>

          <SectionCard
            id="modules"
            title="Module Ladder"
            eyebrow="Unlock in order"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  onClick={() =>
                    module.unlocked && setSelectedDay(module.day_number)
                  }
                  className={`group text-left ${module.unlocked ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <div
                    className={`relative overflow-hidden rounded-3xl border p-4 transition-all ${selectedDay === module.day_number ? "border-[#f5d77b]/40 bg-white/8" : "border-[#2a2417] bg-black/35"}`}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                        Day {module.day_number}
                      </p>
                      <ModuleBadge
                        unlocked={module.unlocked}
                        completed={module.completed}
                      />
                    </div>
                    <h3 className="font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">
                      {module.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      {module.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {module.resources.slice(0, 2).map((resource) => (
                        <span
                          key={resource}
                          className="rounded-full border border-white/8 bg-white/5 px-3 py-1"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
                    {!module.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="text-center">
                          <Lock className="mx-auto text-[#f5d77b]" size={20} />
                          <p className="mt-2 font-['DM_Mono'] text-[9px] uppercase tracking-[0.26em] text-white/55">
                            Locked
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {selectedModule && (
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <SectionCard
                id="timeline"
                title={`Day ${selectedModule.day_number}`}
                eyebrow={
                  selectedModule.completed
                    ? "Completed"
                    : selectedModule.unlocked
                      ? "Ready to watch"
                      : "Locked"
                }
              >
                <div className="space-y-5">
                  <div className="overflow-hidden rounded-3xl border border-[#2a2417] bg-black/45">
                    <div className="aspect-video w-full">
                      <iframe
                        title={selectedModule.title}
                        src={selectedModule.youtube_url}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!selectedModule.unlocked || !!markingDay}
                      onClick={handleMarkWatched}
                      className="inline-flex items-center gap-2 rounded-full border border-[#f5d77b]/25 bg-[#f5d77b]/12 px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.24em] text-[#f5d77b] disabled:opacity-50"
                    >
                      <CirclePlay size={13} />
                      Mark watched
                    </button>
                    <button
                      type="button"
                      disabled={
                        !selectedModule.unlocked ||
                        !selectedModule.watched ||
                        !!markingDay ||
                        selectedModule.completed
                      }
                      onClick={handleMarkCompleted}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.24em] text-white/70 disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} />
                      Mark complete
                    </button>
                  </div>

                  <div>
                    <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                      Notes / resources
                    </p>
                    <ul className="mt-3 grid gap-2 text-sm text-white/68">
                      {selectedModule.resources.map((resource) => (
                        <li
                          key={resource}
                          className="rounded-2xl border border-[#2a2417] bg-white/5 px-4 py-3"
                        >
                          {resource}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-[#2a2417] bg-black/35 p-4">
                    <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-white/45">
                      Status
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/70">
                      <span>
                        Watched: {selectedModule.watched ? "yes" : "no"}
                      </span>
                      <span>
                        Complete: {selectedModule.completed ? "yes" : "no"}
                      </span>
                      <span>
                        Feedback: {feedbackSubmitted ? "submitted" : "required"}
                      </span>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                id="feedback"
                title="Mandatory Feedback"
                eyebrow="Required before unlock"
              >
                <form onSubmit={handleFeedbackSubmit} className="grid gap-4">
                  <RangeField
                    label="Mood"
                    value={feedback.mood}
                    onChange={(value) =>
                      setFeedback((state) => ({ ...state, mood: value }))
                    }
                  />
                  <RangeField
                    label="Energy"
                    value={feedback.energy}
                    onChange={(value) =>
                      setFeedback((state) => ({ ...state, energy: value }))
                    }
                  />
                  <RangeField
                    label="Understanding"
                    value={feedback.understandingLevel}
                    onChange={(value) =>
                      setFeedback((state) => ({
                        ...state,
                        understandingLevel: value,
                      }))
                    }
                  />
                  <RangeField
                    label="Commitment"
                    value={feedback.commitmentScore}
                    onChange={(value) =>
                      setFeedback((state) => ({
                        ...state,
                        commitmentScore: value,
                      }))
                    }
                  />

                  <label className="grid gap-2">
                    <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/50">
                      Biggest takeaway
                    </span>
                    <textarea
                      rows={3}
                      value={feedback.takeaway}
                      onChange={(e) =>
                        setFeedback((state) => ({
                          ...state,
                          takeaway: e.target.value,
                        }))
                      }
                      className="rounded-2xl border border-[#2a2417] bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="What landed most from today?"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/50">
                      Struggles / challenges
                    </span>
                    <textarea
                      rows={3}
                      value={feedback.struggles}
                      onChange={(e) =>
                        setFeedback((state) => ({
                          ...state,
                          struggles: e.target.value,
                        }))
                      }
                      className="rounded-2xl border border-[#2a2417] bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="Where did you get stuck?"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/50">
                      Questions for coach
                    </span>
                    <textarea
                      rows={3}
                      value={feedback.questions}
                      onChange={(e) =>
                        setFeedback((state) => ({
                          ...state,
                          questions: e.target.value,
                        }))
                      }
                      className="rounded-2xl border border-[#2a2417] bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="Ask anything you want Ron to see."
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/50">
                      Optional notes
                    </span>
                    <textarea
                      rows={3}
                      value={feedback.notes}
                      onChange={(e) =>
                        setFeedback((state) => ({
                          ...state,
                          notes: e.target.value,
                        }))
                      }
                      className="rounded-2xl border border-[#2a2417] bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                      placeholder="Any extra context for Ron."
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={!selectedModule.completed || submittingFeedback}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#f5d77b] px-5 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.28em] text-black disabled:opacity-50"
                  >
                    {submittingFeedback ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <MessageSquare size={13} />
                    )}
                    Submit feedback to unlock next day
                  </button>
                </form>
              </SectionCard>
            </div>
          )}

          <SectionCard
            id="analytics"
            title="Analytics"
            eyebrow="Progress signals"
          >
            <TrendChartCard analytics={summary.analytics} />
          </SectionCard>

          <SectionCard title="Coach Review" eyebrow="Final checkpoint">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[#2a2417] bg-black/35 p-4">
                <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                  Discovery call
                </p>
                <p className="mt-3 text-sm text-white/68">
                  {summary.discoveryCall.booked ? "Booked" : "Not booked yet"}
                </p>
                <p className="mt-2 text-xs text-white/45">
                  {summary.discoveryCall.scheduledAt
                    ? new Date(
                        summary.discoveryCall.scheduledAt,
                      ).toLocaleString()
                    : "Awaiting booking"}
                </p>
              </div>

              <div className="rounded-3xl border border-[#2a2417] bg-black/35 p-4">
                <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                  Final review
                </p>
                <p className="mt-3 text-sm text-white/68">
                  {summary.finalReview.coachNotes}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#2a2417] bg-black/35 p-4">
      <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-white/45">
        {label}
      </p>
      <p className="mt-2 font-['Bebas_Neue'] text-4xl leading-none text-white">
        {value}
      </p>
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/50">
          {label}
        </span>
        <span className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-[#f5d77b]/75">
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#f5d77b]"
      />
    </label>
  );
}
