import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Trash2, Users as UsersIcon } from "lucide-react";
import AdminLayout from "@admin/components/AdminLayout";
import ConfirmDialog from "@admin/components/ConfirmDialog";
import { useToast } from "@admin/components/useToast";
import {
  adminApi,
  type TrialUserStatus,
  type TrialAdminUser,
  type TrialAdminUserListResponse,
} from "@admin/api/adminApi";

const STATUS_LABELS: Record<TrialUserStatus, { label: string; color: string }> = {
  lead: { label: "Lead", color: "#6b7280" },
  awaiting_calendly: { label: "Awaiting Call", color: "#f97316" },
  active: { label: "Active", color: "#22c55e" },
  completed: { label: "Completed", color: "#3b82f6" },
  converted: { label: "Converted", color: "#E8192C" },
};

const FILTERS: Array<{ id: "" | TrialUserStatus; label: string }> = [
  { id: "", label: "All" },
  { id: "active", label: "Active" },
  { id: "awaiting_calendly", label: "Awaiting" },
  { id: "completed", label: "Completed" },
  { id: "converted", label: "Converted" },
  { id: "lead", label: "Lead" },
];

export default function AdminTrialUsers() {
  const [data, setData] = useState<TrialAdminUserListResponse | null>(null);
  const [filter, setFilter] = useState<"" | TrialUserStatus>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrialAdminUser | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const { toast, success, error: toastError } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await adminApi.trialUsers({ status: filter, search: debounced });
      setData(d);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = data?.counts ?? {};
  const users = useMemo(() => data?.users ?? [], [data]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteTrialUser(pendingDelete.id);
      success(`${pendingDelete.name || pendingDelete.email} removed.`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-1 font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C]">
            TRIAL USERS
          </p>
          <h1 className="font-['Bebas_Neue'] text-4xl text-white">
            EVERY MEMBER · EVERY DAY
          </h1>
        </div>
        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
          {users.length} shown
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const sel = filter === f.id;
          const c = f.id ? counts[f.id] : data?.total;
          return (
            <button
              key={f.id || "all"}
              onClick={() => setFilter(f.id)}
              className={
                "border px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] transition-colors " +
                (sel
                  ? "border-[#E8192C] bg-[#E8192C]/10 text-white"
                  : "border-[#1c1c1c] text-white/45 hover:border-[#3a3a3a] hover:text-white")
              }
            >
              {f.label}
              {typeof c === "number" && (
                <span className="ml-2 text-white/35">{c}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2 border border-[#1c1c1c] bg-[#0d0d0d] px-3 py-2">
          <Search size={14} className="text-white/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name…"
            className="bg-transparent font-['DM_Sans'] text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8192C] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="border border-[#E8192C]/30 bg-[#E8192C]/10 p-4 font-['DM_Sans'] text-sm text-[#E8192C]">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="border border-[#1c1c1c] bg-[#0d0d0d] py-16 text-center">
          <UsersIcon size={32} className="mx-auto mb-4 text-white/15" />
          <p className="font-['DM_Sans'] text-sm text-white/45">
            No users match the current filter.
          </p>
        </div>
      ) : (
        <div className="border border-[#1c1c1c] bg-[#0d0d0d]">
          <div className="grid grid-cols-[1.5fr_1fr_0.7fr_0.6fr_0.6fr_40px] gap-4 border-b border-[#1c1c1c] px-5 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
            <span>Member</span>
            <span>Status</span>
            <span>Program</span>
            <span>Day</span>
            <span>Joined</span>
            <span />
          </div>
          <ul>
            {users.map((u) => {
              const sLabel = STATUS_LABELS[u.status] ?? STATUS_LABELS.lead;
              return (
                <li
                  key={u.id}
                  className="group relative border-b border-[#1c1c1c] last:border-b-0 hover:bg-[#161616]"
                >
                  <Link
                    to={`/admin/trial/users/${u.id}`}
                    className="grid grid-cols-[1.5fr_1fr_0.7fr_0.6fr_0.6fr_40px] items-center gap-4 px-5 py-4 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-['DM_Sans'] text-sm text-white">
                        {u.name || u.email.split("@")[0]}
                      </p>
                      <p className="truncate font-['DM_Mono'] text-[10px] tracking-wider text-white/35">
                        {u.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: sLabel.color }}
                      />
                      <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/65">
                        {sLabel.label}
                      </span>
                    </div>
                    <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/45">
                      {u.program_type || "—"}
                    </span>
                    <span className="font-['Bebas_Neue'] text-2xl text-[#E8192C]">
                      {u.trialDay ?? "—"}
                    </span>
                    <span className="font-['DM_Mono'] text-[10px] tracking-wider text-white/35">
                      {new Date(u.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span />
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPendingDelete(u);
                    }}
                    aria-label={`Delete ${u.name || u.email}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-2 text-white/25 opacity-0 transition-all hover:bg-[#E8192C]/10 hover:text-[#E8192C] group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        destructive
        busy={deleting}
        title={`Remove ${pendingDelete?.name || pendingDelete?.email || "this user"}?`}
        message={
          <>
            This soft-deletes the user — their orders, completions, and activity
            log stay intact for the audit trail. They will no longer appear in
            admin lists or stats.
            {pendingDelete?.converted_to_paid && (
              <>
                <br />
                <span className="text-[#E8192C]">
                  Heads up: this user has converted to a paid program.
                </span>
              </>
            )}
            <br />
            <span className="text-white/40">
              You can restore them by clearing <code>deleted_at</code> in
              Supabase if needed.
            </span>
          </>
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />

      {toast}
    </AdminLayout>
  );
}
