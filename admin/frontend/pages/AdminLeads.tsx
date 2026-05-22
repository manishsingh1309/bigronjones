import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Download,
  Mail,
  Search,
  Trash2,
} from "lucide-react";
import AdminLayout from "@admin/components/AdminLayout";
import ConfirmDialog from "@admin/components/ConfirmDialog";
import { useToast } from "@admin/components/useToast";
import { adminApi, type Lead, type ContentItem } from "@admin/api/adminApi";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function leadsToCsv(leads: Lead[]): string {
  const header = [
    "Name",
    "Email",
    "Phone",
    "Content",
    "Source",
    "Campaign",
    "Email Sent",
    "Created",
  ];
  const rows = leads.map((l) => [
    l.full_name,
    l.email,
    l.phone || "",
    l.lead_magnets?.title || l.lead_magnet_slug,
    l.utm_source || l.source || "",
    l.utm_campaign || "",
    l.pdf_sent ? "yes" : "no",
    new Date(l.created_at).toISOString(),
  ]);
  const escape = (s: string) =>
    /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  return [header, ...rows]
    .map((row) => row.map((cell) => escape(String(cell))).join(","))
    .join("\n");
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, success, error: toastError } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const leadsRes = await adminApi.listLeads({
        limit: 500,
        contentId: filter !== "all" ? filter : undefined,
        q: debounced || undefined,
      });
      setLeads(leadsRes.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter, debounced]);

  // Initial content load (once)
  useEffect(() => {
    let mounted = true;
    adminApi
      .listContent()
      .then((res) => mounted && setContent(res.items))
      .catch(() => {
        /* non-fatal — filter dropdown just stays empty */
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Leads load on filter/search change
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Clear selections that no longer exist in the current view (e.g. after
  // filter change). Avoids "delete N selected" showing a stale count.
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(leads.map((l) => l.id));
      const next = new Set<string>();
      prev.forEach((id) => visible.has(id) && next.add(id));
      return next.size === prev.size ? prev : next;
    });
  }, [leads]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === leads.length && leads.length > 0) return new Set();
      return new Set(leads.map((l) => l.id));
    });
  }

  function handleExport() {
    const csv = leadsToCsv(leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmDelete() {
    if (!pendingDelete || pendingDelete.length === 0) return;
    setDeleting(true);
    try {
      const res = await adminApi.deleteLeads(pendingDelete);
      // Optimistic-ish: remove from local state without a refetch round-trip.
      const removed = new Set(pendingDelete);
      setLeads((prev) => prev.filter((l) => !removed.has(l.id)));
      setSelected(new Set());
      setPendingDelete(null);
      success(
        res.deleted === 1
          ? "Lead deleted."
          : `${res.deleted} leads deleted.`,
      );
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const allChecked = leads.length > 0 && selected.size === leads.length;
  const someChecked = selected.size > 0 && selected.size < leads.length;
  const bulkCount = selected.size;

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C]">
            CAPTURED
          </p>
          <h1 className="font-['Bebas_Neue'] text-3xl text-white sm:text-4xl">
            ALL LEADS
          </h1>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={leads.length === 0}
          className="flex items-center gap-2 border border-[#1c1c1c] px-6 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-white/60 transition-all hover:border-[#E8192C] hover:text-white disabled:opacity-40"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
          Filter:
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-[#1c1c1c] bg-[#0a0a0a] px-3 py-2 font-['DM_Sans'] text-sm text-white outline-none focus:border-[#E8192C]"
        >
          <option value="all">All content</option>
          {content.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 border border-[#1c1c1c] bg-[#0a0a0a] px-3 py-2">
          <Search size={14} className="text-white/35" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, or phone…"
            className="bg-transparent font-['DM_Sans'] text-sm text-white outline-none placeholder:text-white/25"
          />
        </div>
        <span className="font-['DM_Mono'] text-[10px] tracking-wider text-white/40">
          {loading ? "…" : `${leads.length} shown`}
        </span>
      </div>

      {bulkCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-[#E8192C]/30 bg-[#E8192C]/10 px-4 py-3">
          <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white">
            {bulkCount} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="border border-[#1c1c1c] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(Array.from(selected))}
              className="inline-flex items-center gap-2 bg-[#E8192C] px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white hover:bg-[#b50f1f]"
            >
              <Trash2 size={12} /> Delete {bulkCount}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8192C] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="border border-[#E8192C]/30 bg-[#E8192C]/10 p-4 font-['DM_Sans'] text-sm text-[#E8192C]">
          {error}
        </div>
      ) : leads.length === 0 ? (
        <div className="border border-[#1c1c1c] bg-[#0d0d0d] p-8 text-center sm:p-12 lg:p-16">
          <Mail size={28} className="mx-auto mb-3 text-white/20" />
          <p className="font-['DM_Sans'] text-white/40">
            {debounced || filter !== "all"
              ? "No leads match this filter."
              : "No leads yet. Share a content link on Instagram to start collecting."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#1c1c1c] bg-[#0d0d0d]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1c1c1c]">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked;
                    }}
                    onChange={toggleAll}
                    aria-label="Select all"
                    className="h-4 w-4 cursor-pointer accent-[#E8192C]"
                  />
                </th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Content</Th>
                <Th>Source</Th>
                <Th>Sent</Th>
                <Th>When</Th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const checked = selected.has(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={
                      "border-b border-[#141414] transition-colors last:border-b-0 " +
                      (checked ? "bg-[#E8192C]/[0.06]" : "hover:bg-white/[0.02]")
                    }
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(lead.id)}
                        aria-label={`Select ${lead.full_name}`}
                        className="h-4 w-4 cursor-pointer accent-[#E8192C]"
                      />
                    </td>
                    <Td>
                      <span className="font-['DM_Sans'] text-sm text-white">
                        {lead.full_name}
                      </span>
                    </Td>
                    <Td>
                      <a
                        href={`mailto:${lead.email}`}
                        className="font-['DM_Mono'] text-[11px] tracking-wider text-white/70 hover:text-[#E8192C]"
                      >
                        {lead.email}
                      </a>
                    </Td>
                    <Td>
                      <span className="font-['DM_Mono'] text-[11px] text-white/40">
                        {lead.phone || "—"}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-['DM_Sans'] text-xs text-white/60">
                        {lead.lead_magnets?.title || lead.lead_magnet_slug}
                      </span>
                    </Td>
                    <Td>
                      <span className="font-['DM_Mono'] text-[10px] uppercase tracking-wider text-white/40">
                        {lead.utm_source || lead.source || "direct"}
                      </span>
                    </Td>
                    <Td>
                      {lead.pdf_sent ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle size={12} />
                          <span className="font-['DM_Mono'] text-[10px] uppercase tracking-wider">
                            Yes
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <AlertCircle size={12} />
                          <span className="font-['DM_Mono'] text-[10px] uppercase tracking-wider">
                            Pending
                          </span>
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-['DM_Mono'] text-[10px] tracking-wider text-white/30">
                        {formatDate(lead.created_at)}
                      </span>
                    </Td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setPendingDelete([lead.id])}
                        aria-label={`Delete ${lead.full_name}`}
                        className="rounded p-2 text-white/30 transition-colors hover:bg-[#E8192C]/10 hover:text-[#E8192C]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        destructive
        busy={deleting}
        title={
          pendingDelete && pendingDelete.length > 1
            ? `Delete ${pendingDelete.length} leads?`
            : "Delete this lead?"
        }
        message={
          <>
            This permanently removes the captured contact info.
            <br />
            <span className="text-white/40">
              CSV exports already taken are unaffected. This cannot be undone.
            </span>
          </>
        }
        confirmLabel={
          pendingDelete && pendingDelete.length > 1
            ? `Delete ${pendingDelete.length}`
            : "Delete"
        }
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />

      {toast}
    </AdminLayout>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>;
}
