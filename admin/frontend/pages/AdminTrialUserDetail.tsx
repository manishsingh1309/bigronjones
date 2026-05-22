import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Send,
} from "lucide-react";
import AdminLayout from "@admin/components/AdminLayout";
import {
  adminApi,
  type TrialAdminUserDetailResponse,
} from "@admin/api/adminApi";

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminTrialUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TrialAdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyDay, setReplyDay] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const d = await adminApi.trialUser(id);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function sendReply(completionId: string) {
    setSending(true);
    try {
      await adminApi.trialReply({ completionId, reply: replyText.trim() });
      setReplyText("");
      setReplyDay(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reply failed");
    } finally {
      setSending(false);
    }
  }

  async function markRead(completionId: string) {
    await adminApi.trialMarkRead(completionId);
    await load();
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8192C] border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="border border-[#E8192C]/30 bg-[#E8192C]/10 p-4 font-['DM_Sans'] text-sm text-[#E8192C]">
          {error || "User not found"}
        </div>
      </AdminLayout>
    );
  }

  const { user, completions, metrics, activity } = data;

  return (
    <AdminLayout>
      <Link
        to="/admin/trial/users"
        className="mb-6 inline-flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white"
      >
        <ArrowLeft size={12} /> Back to all users
      </Link>

      {/* Header card */}
      <div className="mb-6 border border-[#1c1c1c] bg-[#0d0d0d] p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
              {user.status.replace("_", " ")} · Day {user.trialDay ?? "—"} of 7
            </p>
            <h1 className="mt-1 font-['Bebas_Neue'] text-4xl tracking-wide text-white">
              {user.name || user.email}
            </h1>
            <p className="mt-1 flex items-center gap-2 font-['DM_Mono'] text-[11px] tracking-wider text-white/45">
              <Mail size={12} /> {user.email}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label="Program" value={user.program_type || "—"} />
            <Stat
              label="Joined"
              value={new Date(user.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            />
            <Stat
              label="Started"
              value={
                user.trial_start_date
                  ? new Date(user.trial_start_date).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )
                  : "—"
              }
            />
            <Stat
              label="Completions"
              value={`${completions.length}/7`}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Day-by-day completions */}
        <div className="space-y-3">
          <h2 className="font-['Bebas_Neue'] text-2xl tracking-wider text-white">
            DAILY CHECKLISTS
          </h2>
          {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
            const c = completions.find((x) => x.trial_day === day);
            const m = metrics.find((x) => x.trial_day === day);
            if (!c && !m) {
              return (
                <div
                  key={day}
                  className="flex items-center justify-between border border-[#1c1c1c] bg-[#0d0d0d] px-5 py-4 opacity-50"
                >
                  <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/35">
                    Day {day}
                  </span>
                  <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
                    {(user.trialDay ?? 0) >= day ? "Missed" : "Upcoming"}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={day}
                className="border border-[#1c1c1c] bg-[#0d0d0d] p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center bg-[#E8192C] text-white">
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <p className="font-['Bebas_Neue'] text-xl tracking-wide text-white">
                      DAY {day}
                    </p>
                    <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/40">
                      {c?.completed_at &&
                        new Date(c.completed_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                    </p>
                  </div>
                  {c && !c.ron_viewed && c.feedback_text && (
                    <span className="ml-auto bg-[#E8192C] px-2 py-0.5 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white">
                      New Feedback
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {c && (
                    <>
                      <Mini label="Watched" value={c.watched_video} />
                      <Mini label="Workout" value={c.completed_workout} />
                      <Mini label="Nutrition" value={c.logged_nutrition} />
                      <Mini label="Notes" value={c.reviewed_notes} />
                    </>
                  )}
                </div>

                {c && (c.energy_rating || c.difficulty_rating) && (
                  <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
                    {c.overall_feeling && (
                      <Pill label="Feeling" value={c.overall_feeling} />
                    )}
                    {c.energy_rating && (
                      <Pill
                        label="Energy"
                        value={`${c.energy_rating}/5`}
                      />
                    )}
                    {c.difficulty_rating && (
                      <Pill
                        label="Difficulty"
                        value={`${c.difficulty_rating}/5`}
                      />
                    )}
                  </div>
                )}

                {m && (
                  <div className="mt-3 grid grid-cols-4 gap-2 text-[12px]">
                    <Pill label="Sleep" value={`${m.sleep_quality}/10`} />
                    <Pill label="Soreness" value={`${m.soreness_level}/10`} />
                    <Pill label="Energy" value={`${m.energy_level}/10`} />
                    {m.mood !== null && (
                      <Pill label="Mood" value={`${m.mood}/10`} />
                    )}
                  </div>
                )}

                {c?.feedback_text && (
                  <div className="mt-4 border-l-2 border-[#E8192C]/50 pl-4">
                    <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                      Member message
                    </p>
                    <p className="mt-1 text-[14px] leading-relaxed text-white/85">
                      "{c.feedback_text}"
                    </p>
                  </div>
                )}

                {c?.ron_reply && (
                  <div className="mt-4 border border-[#E8192C]/30 bg-[#E8192C]/10 p-4">
                    <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#E8192C]">
                      Your Reply
                      {c.ron_replied_at &&
                        " · " + relTime(c.ron_replied_at)}
                    </p>
                    <p className="mt-2 text-[14px] leading-relaxed text-white">
                      {c.ron_reply}
                    </p>
                  </div>
                )}

                {c?.feedback_text && !c.ron_reply && (
                  <div className="mt-4">
                    {replyDay === day ? (
                      <div className="border border-[#1c1c1c] bg-[#0a0a0a] p-3">
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Reply to this member directly…"
                          className="w-full resize-none bg-transparent font-['DM_Sans'] text-sm text-white outline-none placeholder:text-white/25"
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setReplyDay(null);
                              setReplyText("");
                            }}
                            className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={sending || !replyText.trim()}
                            onClick={() => sendReply(c.id)}
                            className="inline-flex items-center gap-2 bg-[#E8192C] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f] disabled:opacity-60"
                          >
                            <Send size={12} /> {sending ? "Sending…" : "Send Reply"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReplyDay(day)}
                          className="inline-flex items-center gap-2 border border-[#E8192C] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#E8192C]"
                        >
                          <MessageSquare size={12} /> Reply
                        </button>
                        {!c.ron_viewed && (
                          <button
                            onClick={() => markRead(c.id)}
                            className="inline-flex items-center gap-2 border border-[#1c1c1c] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45 hover:text-white"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Activity sidebar */}
        <div className="border border-[#1c1c1c] bg-[#0d0d0d]">
          <div className="flex items-center gap-2 border-b border-[#1c1c1c] p-5">
            <Clock size={14} className="text-[#E8192C]" />
            <h2 className="font-['Bebas_Neue'] text-xl tracking-wider text-white">
              ACTIVITY HISTORY
            </h2>
          </div>
          {activity.length === 0 ? (
            <p className="p-6 text-center font-['DM_Sans'] text-sm text-white/40">
              No activity yet.
            </p>
          ) : (
            <ul className="max-h-[600px] overflow-y-auto">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="border-b border-[#1c1c1c] px-5 py-3 last:border-b-0"
                >
                  <p className="font-['DM_Sans'] text-[13px] text-white">
                    {a.activity_type.replace(/_/g, " ")}
                  </p>
                  <p className="font-['DM_Mono'] text-[9px] tracking-wider text-white/30">
                    {relTime(a.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#1c1c1c] bg-black px-3 py-2">
      <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <p className="mt-1 font-['Bebas_Neue'] text-xl text-white">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      className={
        "flex items-center gap-2 border px-3 py-2 " +
        (value
          ? "border-[#E8192C]/40 bg-[#E8192C]/10"
          : "border-[#1c1c1c] bg-black/40")
      }
    >
      <span
        className={
          "h-2 w-2 rounded-full " + (value ? "bg-[#E8192C]" : "bg-white/15")
        }
      />
      <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/65">
        {label}
      </span>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-[#1c1c1c] bg-black px-3 py-2">
      <span className="block font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>
      <span className="font-['DM_Sans'] text-[13px] text-white">{value}</span>
    </div>
  );
}
