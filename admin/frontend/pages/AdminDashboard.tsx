import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MessageSquare,
  PlusCircle,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import AdminLayout from "@admin/components/AdminLayout";
import { authHeaders } from "@/auth/api";
import { adminApi, type SuperAdminDashboardResponse } from "@admin/api/adminApi";

const statusColors = ["#f5d77b", "#ffffff", "#c9a54f", "#7d6430"];

const QUICK_ACCESS = [
  {
    to: "/admin/content",
    icon: FileText,
    label: "Content",
    hint: "Lead magnets · Instagram links",
  },
  {
    to: "/admin/leads",
    icon: Users,
    label: "Leads",
    hint: "Every name + email captured",
  },
  {
    to: "/admin/trial/users",
    icon: UserCheck,
    label: "Trial Users",
    hint: "Active 7-day trials",
  },
  {
    to: "/admin/trial/feedback",
    icon: MessageSquare,
    label: "Feedback",
    hint: "Reply to daily check-ins",
  },
] as const;

function QuickAccessGrid() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.28em] text-[#f5d77b]/75">
            Quick access
          </p>
          <h2 className="mt-1 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">
            Jump to a section
          </h2>
        </div>
        <Link
          to="/admin/content/new"
          className="inline-flex items-center gap-2 rounded-full bg-[#E8192C] px-5 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.24em] text-white hover:bg-[#b50f1f] transition-colors"
        >
          <PlusCircle size={13} />
          New lead magnet
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACCESS.map(({ to, icon: Icon, label, hint }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-3xl border border-[#2a2417] bg-black/40 p-5 transition-all hover:border-[#E8192C] hover:bg-[#E8192C]/5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="rounded-full bg-[#E8192C]/15 p-2.5 text-[#E8192C] group-hover:bg-[#E8192C] group-hover:text-white transition-colors">
                <Icon size={16} />
              </div>
              <ArrowUpRight
                size={16}
                className="text-white/30 group-hover:text-[#E8192C] transition-colors"
              />
            </div>
            <p className="font-['Bebas_Neue'] text-2xl tracking-[0.06em] text-white">
              {label}
            </p>
            <p className="mt-1 font-['DM_Sans'] text-xs text-white/50 leading-relaxed">
              {hint}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-[#2a2417] bg-[linear-gradient(180deg,rgba(245,215,123,0.1),rgba(8,8,8,0.96))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-4">
        <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-white/45">
          {label}
        </p>
        <Icon size={16} className="text-[#f5d77b]" />
      </div>
      <p className="mt-4 font-['Bebas_Neue'] text-5xl leading-none text-white">
        {value}
      </p>
      {hint && <p className="mt-2 text-sm text-white/55">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [data, setData] = useState<SuperAdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState<
    "all" | "super_admin" | "admin" | "user"
  >("all");
  const [noteUserId, setNoteUserId] = useState("");
  const [noteLabel, setNoteLabel] = useState<
    "general" | "high-risk" | "high-potential"
  >("general");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadRole() {
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/me", { headers, credentials: "include" });
        const json = await res.json().catch(() => ({}));
        if (!mounted) return;
        setRole(json.user?.role || null);
      } catch {
        if (mounted) setRole(null);
      } finally {
        if (mounted) setLoadingRole(false);
      }
    }
    loadRole();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loadingRole || role !== "super_admin") return;
    let mounted = true;
    setLoading(true);
    setError(null);
    adminApi
      .superDashboard()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch((err: Error) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [loadingRole, role]);

  const filteredUsers = useMemo(() => {
    const rows = data?.recentUsers || [];
    const term = search.trim().toLowerCase();
    return rows.filter((user) => {
      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);
      const matchesLabel = labelFilter === "all" || user.role === labelFilter;
      return matchesSearch && matchesLabel;
    });
  }, [data?.recentUsers, search, labelFilter]);

  async function handleAddNote() {
    if (!noteUserId || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await adminApi.addCoachNote({
        userId: noteUserId,
        note: noteText.trim(),
        label: noteLabel,
      });
      setNoteText("");
      const next = await adminApi.superDashboard();
      setData(next);
    } finally {
      setSavingNote(false);
    }
  }

  if (loadingRole) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-[#f5d77b]" size={28} />
        </div>
      </AdminLayout>
    );
  }

  // Regular admins (role === "admin") still get a working dashboard — just
  // without the super-admin-only analytics + coach-notes panels below.
  if (role !== "super_admin") {
    return (
      <AdminLayout>
        <div className="space-y-8 text-white">
          <section className="rounded-3xl border border-[#2a2417] bg-[linear-gradient(135deg,rgba(245,215,123,0.15),rgba(8,8,8,0.98))] p-6 md:p-8">
            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#f5d77b]/75">
              Admin operations
            </p>
            <h1 className="mt-3 font-['Bebas_Neue'] text-5xl leading-none tracking-[0.08em] md:text-6xl">
              Welcome back
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
              Manage your content, leads, and trial users from here. Use the
              quick access cards below to jump into any section.
            </p>
          </section>
          <QuickAccessGrid />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 text-white">
        <section className="rounded-4xl border border-[#2a2417] bg-[linear-gradient(135deg,rgba(245,215,123,0.15),rgba(8,8,8,0.98))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.38)] md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#f5d77b]/75">
                Super admin operations
              </p>
              <h1 className="mt-3 font-['Bebas_Neue'] text-5xl leading-none tracking-[0.08em] md:text-7xl">
                Ron's command center
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
                Track user progress, unlock cadence, feedback trends, and
                private coaching notes across the full 7-day system.
              </p>
            </div>
            <Link
              to="/admin/trial/users"
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#f5d77b] px-5 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.28em] text-black"
            >
              View trial users
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>

        <QuickAccessGrid />

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-3xl border border-[#2a2417] bg-black/40">
            <Loader2 className="animate-spin text-[#f5d77b]" size={28} />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-[#f5d77b]/30 bg-[#f5d77b]/10 p-4 text-sm text-white/80">
            {error}
          </div>
        ) : data ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Users}
                label="Total users"
                value={data.stats.totalUsers}
                hint={`${data.stats.paidUsers} paid · ${data.stats.superAdmins} super admins`}
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed trials"
                value={data.stats.completedTrials}
                hint={`${data.stats.feedbackCount} feedback submissions`}
              />
              <StatCard
                icon={MessageSquare}
                label="Recent feedback"
                value={data.stats.feedbackRecent7d}
                hint="last 7 days"
              />
              <StatCard
                icon={Clock3}
                label="Unlocked rows"
                value={data.stats.unlockedDayRows}
                hint="video progress records"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-[#2a2417] bg-black/40 p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                      Engagement
                    </p>
                    <h2 className="mt-1 font-['Bebas_Neue'] text-4xl tracking-[0.08em]">
                      Feedback trends
                    </h2>
                  </div>
                  <span className="rounded-full border border-[#2a2417] bg-white/5 px-3 py-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/55">
                    7-day average
                  </span>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.feedbackTrend}>
                      <CartesianGrid stroke="#2f2719" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#8b7a53" fontSize={11} />
                      <YAxis stroke="#8b7a53" fontSize={11} domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{
                          background: "#080808",
                          border: "1px solid #2a2417",
                          borderRadius: 16,
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="#f5d77b"
                        fill="#f5d77b"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="energy"
                        stroke="#ffffff"
                        fill="#ffffff"
                        fillOpacity={0.08}
                      />
                      <Area
                        type="monotone"
                        dataKey="commitmentScore"
                        stroke="#c9a54f"
                        fill="#c9a54f"
                        fillOpacity={0.12}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-[#2a2417] bg-black/40 p-5">
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                    Completion mix
                  </p>
                  <div className="mt-3 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.progressTrend}
                          dataKey="completed"
                          nameKey="day"
                          innerRadius={54}
                          outerRadius={82}
                          paddingAngle={2}
                        >
                          {data.progressTrend.map((entry, index) => (
                            <Cell
                              key={entry.day}
                              fill={statusColors[index % statusColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#080808",
                            border: "1px solid #2a2417",
                            borderRadius: 16,
                            color: "#fff",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#2a2417] bg-black/40 p-5">
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                    Unlock progress
                  </p>
                  <div className="mt-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.progressTrend}>
                        <CartesianGrid stroke="#2f2719" strokeDasharray="3 3" />
                        <XAxis dataKey="day" stroke="#8b7a53" fontSize={11} />
                        <YAxis stroke="#8b7a53" fontSize={11} />
                        <Tooltip
                          contentStyle={{
                            background: "#080808",
                            border: "1px solid #2a2417",
                            borderRadius: 16,
                            color: "#fff",
                          }}
                        />
                        <Bar
                          dataKey="watched"
                          fill="#f5d77b"
                          radius={[10, 10, 0, 0]}
                        />
                        <Bar
                          dataKey="unlocked"
                          fill="#ffffff"
                          fillOpacity={0.65}
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-[#2a2417] bg-black/40 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                      Users
                    </p>
                    <h2 className="mt-1 font-['Bebas_Neue'] text-4xl tracking-[0.08em]">
                      Progress table
                    </h2>
                  </div>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email"
                    className="rounded-full border border-[#2a2417] bg-black/35 px-4 py-2 text-sm text-white outline-none placeholder:text-white/25"
                  />
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {(["all", "super_admin", "admin", "user"] as const).map(
                    (item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setLabelFilter(item)}
                        className={`rounded-full border px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.24em] ${labelFilter === item ? "border-[#f5d77b]/30 bg-[#f5d77b]/12 text-[#f5d77b]" : "border-[#2a2417] bg-white/5 text-white/60"}`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                </div>

                <div className="overflow-x-auto rounded-3xl border border-[#2a2417]">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="bg-white/5 font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-white/45">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Booking</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-[#2a2417] bg-black/20"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-white/45">
                              {user.email}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-white/70">
                            {user.payment_status || "pending"}
                          </td>
                          <td className="px-4 py-3 text-white/70">
                            {user.has_booked_calendly ? "Booked" : "Waiting"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full border border-[#2a2417] bg-white/5 px-3 py-1 font-['DM_Mono'] text-[9px] uppercase tracking-[0.22em] text-white/60">
                              {user.role || "user"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-[#2a2417] bg-black/40 p-5">
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                    Private notes
                  </p>
                  <div className="mt-4 grid gap-3">
                    <select
                      value={noteUserId}
                      onChange={(e) => setNoteUserId(e.target.value)}
                      className="rounded-2xl border border-[#2a2417] bg-black/35 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="">Select user</option>
                      {data.recentUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} · {user.email}
                        </option>
                      ))}
                    </select>
                    <select
                      value={noteLabel}
                      onChange={(e) =>
                        setNoteLabel(e.target.value as typeof noteLabel)
                      }
                      className="rounded-2xl border border-[#2a2417] bg-black/35 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="general">General</option>
                      <option value="high-risk">High risk</option>
                      <option value="high-potential">High potential</option>
                    </select>
                    <textarea
                      rows={4}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a private coaching note..."
                      className="rounded-2xl border border-[#2a2417] bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
                    />
                    <button
                      type="button"
                      onClick={handleAddNote}
                      disabled={savingNote || !noteUserId || !noteText.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f5d77b] px-5 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.28em] text-black disabled:opacity-50"
                    >
                      {savingNote ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Sparkles size={13} />
                      )}
                      Save note
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#2a2417] bg-black/40 p-5">
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                    Recent feedback
                  </p>
                  <div className="mt-4 space-y-3">
                    {data.recentFeedback.map((feedback) => (
                      <div
                        key={feedback.id}
                        className="rounded-2xl border border-[#2a2417] bg-white/5 p-4 text-sm text-white/72"
                      >
                        <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-[#f5d77b]/70">
                          Day {feedback.day_number} ·{" "}
                          {feedback.users?.name || feedback.users?.email}
                        </p>
                        <p className="mt-2 text-white">
                          {feedback.takeaway ||
                            feedback.notes ||
                            "No details provided"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#2a2417] bg-black/40 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-[#f5d77b]/70">
                    System notes
                  </p>
                  <h2 className="mt-1 font-['Bebas_Neue'] text-4xl tracking-[0.08em]">
                    Operational context
                  </h2>
                </div>
                <Link
                  to="/admin/trial/feedback"
                  className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.24em] text-[#f5d77b]"
                >
                  Open inbox
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {data.coachNotes.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-3xl border border-[#2a2417] bg-white/5 p-4"
                  >
                    <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.24em] text-[#f5d77b]/70">
                      {note.label}
                    </p>
                    <p className="mt-2 text-sm text-white/72">{note.note}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
