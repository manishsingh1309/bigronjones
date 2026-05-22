import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MessageSquare, Star, X } from "lucide-react";

type Feeling = "great" | "good" | "okay" | "tough" | "rough";

export type DayChecklistPayload = {
  watchedVideo: boolean;
  completedWorkout: boolean;
  loggedNutrition: boolean;
  reviewedNotes: boolean;
  energyRating: number;
  difficultyRating: number;
  overallFeeling: Feeling;
  feedbackText: string;
};

type Props = {
  day: number;
  submitting: boolean;
  onSubmit: (payload: DayChecklistPayload) => void;
  onClose: () => void;
};

const CHECKLIST: Array<{ key: keyof DayChecklistPayload; label: string }> = [
  { key: "watchedVideo", label: "Watched today's training video" },
  { key: "completedWorkout", label: "Completed my workout (gym or home)" },
  { key: "loggedNutrition", label: "Stayed on track with nutrition" },
  { key: "reviewedNotes", label: "Reviewed my notes from the video" },
];

const FEELINGS: Array<{ val: Feeling; emoji: string; label: string }> = [
  { val: "great", emoji: "🔥", label: "Great" },
  { val: "good", emoji: "💪", label: "Good" },
  { val: "okay", emoji: "👍", label: "Okay" },
  { val: "tough", emoji: "😤", label: "Tough" },
  { val: "rough", emoji: "😓", label: "Rough" },
];

export default function DayChecklistModal({
  day,
  submitting,
  onSubmit,
  onClose,
}: Props) {
  const [checks, setChecks] = useState<{
    watchedVideo: boolean;
    completedWorkout: boolean;
    loggedNutrition: boolean;
    reviewedNotes: boolean;
  }>({
    watchedVideo: false,
    completedWorkout: false,
    loggedNutrition: false,
    reviewedNotes: false,
  });
  const [feeling, setFeeling] = useState<Feeling>("good");
  const [energy, setEnergy] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [feedback, setFeedback] = useState("");

  const checkedCount = Object.values(checks).filter(Boolean).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...checks,
      energyRating: energy,
      difficultyRating: difficulty,
      overallFeeling: feeling,
      feedbackText: feedback.trim(),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[#1c1c1c] bg-[#0d0d0d]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1c1c1c] bg-[#0d0d0d] px-7 py-5">
          <div>
            <p className="mb-0.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
              Day {day} Complete
            </p>
            <h3 className="font-['Bebas_Neue'] text-2xl leading-none tracking-wide text-white">
              YOUR DAILY CHECKLIST
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/30 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 px-7 py-6">
          {/* Checklist */}
          <div>
            <p className="mb-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
              What did you do today?
            </p>
            <div className="space-y-1">
              {CHECKLIST.map((item) => {
                const checked = checks[
                  item.key as keyof typeof checks
                ] as boolean;
                return (
                  <label
                    key={item.key}
                    className="-mx-3 flex cursor-pointer items-center gap-4 px-3 py-2 transition-colors hover:bg-[#161616]"
                  >
                    <span
                      className={
                        "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-all duration-150 " +
                        (checked
                          ? "border-[#E8192C] bg-[#E8192C]"
                          : "border-[#1c1c1c] group-hover:border-[#555]")
                      }
                    >
                      {checked && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={
                        "font-['DM_Sans'] text-sm transition-colors " +
                        (checked ? "text-white" : "text-white/55")
                      }
                    >
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) =>
                        setChecks((c) => ({
                          ...c,
                          [item.key]: e.target.checked,
                        }))
                      }
                    />
                  </label>
                );
              })}
            </div>
            <p className="mt-3 font-['DM_Mono'] text-[9px] tracking-wider text-white/20">
              {checkedCount} of {CHECKLIST.length} completed
            </p>
          </div>

          {/* Feeling */}
          <div>
            <p className="mb-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
              How was Day {day}?
            </p>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map((f) => {
                const sel = feeling === f.val;
                return (
                  <button
                    key={f.val}
                    type="button"
                    onClick={() => setFeeling(f.val)}
                    className={
                      "flex flex-col items-center gap-1 border px-4 py-3 text-sm transition-all " +
                      (sel
                        ? "border-[#E8192C] bg-[#E8192C]/10"
                        : "border-[#1c1c1c] hover:border-[#555]")
                    }
                  >
                    <span className="text-xl">{f.emoji}</span>
                    <span className="font-['DM_Sans'] text-xs text-white/60">
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Star ratings */}
          <div className="grid grid-cols-2 gap-5">
            <RatingRow label="Energy Level" value={energy} onChange={setEnergy} />
            <RatingRow
              label="Difficulty"
              value={difficulty}
              onChange={setDifficulty}
            />
          </div>

          {/* Feedback to Ron */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare size={13} className="text-[#E8192C]" />
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                Message to Ron (optional)
              </p>
            </div>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={`How did Day ${day} go? What's working? What's hard? Ron reads every message.`}
              className="w-full resize-none border border-[#1c1c1c] bg-[#0a0a0a] px-4 py-3 font-['DM_Sans'] text-sm text-white outline-none transition-colors placeholder:text-white/15 focus:border-[#E8192C]"
            />
            <p className="mt-2 font-['DM_Mono'] text-[9px] uppercase tracking-[0.15em] text-white/20">
              Ron sees this on his admin dashboard in real time
            </p>
          </div>

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex w-full items-center justify-center gap-3 bg-[#E8192C] py-4 font-['Bebas_Neue'] text-xl tracking-widest text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                SUBMITTING...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> COMPLETE DAY {day}
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="mb-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`${label} ${n} of 5`}
            >
              <Star
                size={20}
                className="transition-colors"
                style={{
                  color: filled ? "#E8192C" : "#1c1c1c",
                  fill: filled ? "#E8192C" : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
