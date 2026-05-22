import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
} from "lucide-react";
import AdminLayout from "@admin/components/AdminLayout";
import { adminApi, type TrialAdminStatsResponse } from "@admin/api/adminApi";
import { supabase } from "@/auth/supabase";

const ACTIVITY_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: "Logged in", color: "#3b82f6" },
  video_started: { label: "Started video", color: "#8b5cf6" },
  video_completed: { label: "Finished video", color: "#22c55e" },
  day_completed: { label: "Marked day complete", color: "#E8192C" },
  feedback_submitted: { label: "Sent feedback", color: "#eab308" },
  playlist_opened: { label: "Opened playlist", color: "#06b6d4" },
  metrics_submitted: { label: "Submitted metrics", color: "#84cc16" },
  call_booked: { label: "Booked discovery call", color: "#a855f7" },
  phase2_viewed: { label: "Viewed continuation", color: "#f97316" },
  admin_replied: { label: "Ron replied", color: "#E8192C" },
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="border border-[#1c1c1c] bg-[#0d0d0d] p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
          {label}
        </span>
        <Icon size={16} className="text-[#E8192C]" />
      </div>
      <p className="font-['Bebas_Neue'] text-5xl leading-none text-white">
        {value}
      </p>
      {hint && (
        <p className="mt-2 font-['DM_Mono'] text-[10px] tracking-wider text-white/30">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function AdminTrialOverview() {
  const [data, setData] = useState<TrialAdminStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [pulse, setPulse] = useState(0);
  const reloadGuard = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    function load() {
      adminApi
        .trialStats()
        .then((d) => mounted && setData(d))
        .catch((err: Error) => mounted && setError(err.message))
        .finally(() => mounted && setLoading(false));
    }
    load();

    // Coalesce realtime events: when many rows fire in a short window we only
    // want one re-fetch. 600ms debounce keeps the feed snappy without thrash.
    const debouncedReload = () => {
      if (reloadGuard.current) clearTimeout(reloadGuard.current);
      reloadGuard.current = setTimeout(() => {
        load();
        setPulse((p) => p + 1);
      }, 600);
    };

    // Realtime subscriptions to user_activity_log + day_completions. Service-
    // role inserts in Supabase emit Postgres CDC events to subscribed clients.
    const channel = supabase
      .channel("admin-trial-overview")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_activity_log" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "day_completions" },
        debouncedReload,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "day_completions" },
        debouncedReload,
      )
      .subscribe();

    // Slow-poll fallback in case the realtime channel drops (every 60s).
    const pollId = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(pollId);
      if (reloadGuard.current) clearTimeout(reloadGuard.current);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AdminLayout>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C]">
            7-DAY TRIAL
          </p>
          <h1 className="font-['Bebas_Neue'] text-4xl text-white">OVERSIGHT DASHBOARD</h1>
        </div>
        <span className="flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
          <span
            key={pulse}
            className="h-2 w-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]"
            style={{ animation: "pulse 1.2s ease-out" }}
          />
          Live · realtime
        </span>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox msg={error} />
      ) : data ? (
        <>
          <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Active Trials"
              value={data.stats.activeTrials}
              hint={`${data.stats.paidUsers} paid · ${data.stats.completedTrials} completed`}
            />
            <StatCard
              icon={CheckCircle2}
              label="Day Completions"
              value={data.stats.completionsTotal}
              hint="all-time totals"
            />
            <StatCard
              icon={MessageSquare}
              label="Unread Feedback"
              value={data.stats.feedbackPending}
              hint={`+${data.stats.feedbackLast24h} in last 24h`}
            />
            <StatCard
              icon={Clock}
              label="Last 7 Days"
              value={`+${data.stats.purchasedLast7d}`}
              hint="new trial users"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Live activity feed */}
            <div className="border border-[#1c1c1c] bg-[#0d0d0d]">
              <div className="flex items-center justify-between border-b border-[#1c1c1c] p-5">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-[#E8192C]" />
                  <h2 className="font-['Bebas_Neue'] text-xl tracking-wider text-white">
                    LIVE ACTIVITY
                  </h2>
                </div>
                <Link
                  to="/admin/trial/users"
                  className="flex items-center gap-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white"
                >
                  All users <ArrowUpRight size={12} />
                </Link>
              </div>
              {data.recentActivity.length === 0 ? (
                <p className="p-8 text-center font-['DM_Sans'] text-sm text-white/40">
                  No activity yet.
                </p>
              ) : (
                <ul>
                  {data.recentActivity.map((a) => {
                    const meta = ACTIVITY_LABELS[a.activity_type] || {
                      label: a.activity_type,
                      color: "#666",
                    };
                    const md = (a.metadata || {}) as Record<string, unknown>;
                    const day = md.day != null ? `Day ${md.day}` : null;
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 border-b border-[#1c1c1c] px-5 py-3 last:border-b-0"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-['DM_Sans'] text-sm text-white">
                            {a.user?.name || a.user?.email || "Unknown user"}{" "}
                            <span className="text-white/45">{meta.label}</span>
                            {day && (
                              <span className="ml-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#E8192C]">
                                · {day}
                              </span>
                            )}
                          </p>
                          {a.user?.email && (
                            <p className="truncate font-['DM_Mono'] text-[9px] tracking-wider text-white/30">
                              {a.user.email}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-['DM_Mono'] text-[9px] tracking-wider text-white/25">
                          {relTime(a.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Recent unread feedback preview */}
            <div className="border border-[#1c1c1c] bg-[#0d0d0d]">
              <div className="flex items-center justify-between border-b border-[#1c1c1c] p-5">
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-[#E8192C]" />
                  <h2 className="font-['Bebas_Neue'] text-xl tracking-wider text-white">
                    RECENT FEEDBACK
                  </h2>
                </div>
                <Link
                  to="/admin/trial/feedback"
                  className="flex items-center gap-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-white/40 hover:text-white"
                >
                  Inbox <ArrowUpRight size={12} />
                </Link>
              </div>
              {data.recentFeedback.length === 0 ? (
                <p className="p-8 text-center font-['DM_Sans'] text-sm text-white/40">
                  No feedback yet.
                </p>
              ) : (
                <ul>
                  {data.recentFeedback.map((f) => (
                    <li
                      key={f.id}
                      className="border-b border-[#1c1c1c] px-5 py-4 last:border-b-0"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-[#E8192C]">
                          Day {f.trial_day}
                        </span>
                        {f.overall_feeling && (
                          <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                            · {f.overall_feeling}
                          </span>
                        )}
                        {!f.ron_viewed && (
                          <span className="ml-auto bg-[#E8192C] px-2 py-0.5 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white">
                            New
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 font-['DM_Sans'] text-sm text-white/85">
                        "{f.feedback_text}"
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <Link
                          to={`/admin/trial/users/${f.user_id}`}
                          className="font-['DM_Mono'] text-[10px] tracking-wider text-white/40 hover:text-white"
                        >
                          {f.users?.name} · {f.users?.email}
                        </Link>
                        <span className="font-['DM_Mono'] text-[9px] tracking-wider text-white/25">
                          {relTime(f.completed_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8192C] border-t-transparent" />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="border border-[#E8192C]/30 bg-[#E8192C]/10 p-4 font-['DM_Sans'] text-sm text-[#E8192C]">
      {msg}
    </div>
  );
}
