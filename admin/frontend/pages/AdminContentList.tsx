import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  ExternalLink,
  Eye,
  Users,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  PlusCircle,
} from "lucide-react";
import AdminLayout from "@admin/components/AdminLayout";
import { adminApi, type ContentItem, type ContentType } from "@admin/api/adminApi";

const TYPE_COLORS: Record<ContentType, string> = {
  pdf: "bg-blue-500/20 text-blue-400",
  ebook: "bg-purple-500/20 text-purple-400",
  youtube: "bg-red-500/20 text-red-400",
  url: "bg-green-500/20 text-green-400",
  file: "bg-amber-500/20 text-amber-400",
};

export default function AdminContentList() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const siteUrl =
    (import.meta.env.VITE_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  async function load() {
    try {
      setLoading(true);
      const { items } = await adminApi.listContent();
      setItems(items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function copyLink(slug: string) {
    const url = `${siteUrl}/free/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  }

  async function toggleActive(item: ContentItem) {
    setPendingId(item.id);
    try {
      await adminApi.updateContent({ ...item, active: !item.active });
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, active: !it.active } : it))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(item: ContentItem) {
    if (
      !confirm(
        `Delete "${item.title}"? This removes the landing page but does NOT delete past leads.`
      )
    ) {
      return;
    }
    setPendingId(item.id);
    try {
      await adminApi.deleteContent(item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <p className="font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C] mb-1">
            MANAGE
          </p>
          <h1 className="font-['Bebas_Neue'] text-3xl sm:text-4xl text-white">ALL CONTENT</h1>
        </div>
        <Link
          to="/admin/content/new"
          className="flex items-center gap-2 px-6 py-3 bg-[#E8192C] text-white font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:bg-[#b50f1f] transition-colors"
        >
          <PlusCircle size={14} />
          New Content
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-[#E8192C]/10 border border-[#E8192C]/30 p-4 font-['DM_Sans'] text-sm text-[#E8192C]">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#0d0d0d] border border-[#1c1c1c] p-8 sm:p-12 lg:p-16 text-center">
          <p className="font-['DM_Sans'] text-white/40 mb-6">
            No content yet. Create your first piece — it takes about 30 seconds.
          </p>
          <Link
            to="/admin/content/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8192C] text-white font-['Bebas_Neue'] text-lg tracking-widest hover:bg-[#b50f1f] transition-colors"
          >
            CREATE FIRST CONTENT
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#0d0d0d] border border-[#1c1c1c] p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:border-[#2a2a2a] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`font-['DM_Mono'] text-[9px] tracking-[0.2em] px-2 py-0.5 uppercase ${
                      TYPE_COLORS[item.type] || "bg-white/10 text-white/40"
                    }`}
                  >
                    {item.type}
                  </span>
                  {!item.active && (
                    <span className="font-['DM_Mono'] text-[9px] tracking-[0.2em] text-white/25 uppercase">
                      INACTIVE
                    </span>
                  )}
                </div>
                <h3 className="font-['Bebas_Neue'] text-xl text-white leading-tight mb-1">
                  {item.title}
                </h3>
                <p className="font-['DM_Mono'] text-[10px] text-white/30 tracking-wider truncate">
                  {siteUrl}/free/{item.slug}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1.5">
                    <Eye size={12} className="text-white/30" />
                    <span className="font-['Bebas_Neue'] text-lg text-white">
                      {item.view_count}
                    </span>
                  </div>
                  <p className="font-['DM_Mono'] text-[8px] tracking-wider text-white/25">
                    VIEWS
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-[#E8192C]" />
                    <span className="font-['Bebas_Neue'] text-lg text-[#E8192C]">
                      {item.download_count}
                    </span>
                  </div>
                  <p className="font-['DM_Mono'] text-[8px] tracking-wider text-white/25">
                    LEADS
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyLink(item.slug)}
                  className="flex items-center gap-2 px-4 py-2 border border-[#1c1c1c] text-white/50 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:border-[#E8192C] hover:text-white transition-all"
                >
                  <Copy size={12} />
                  {copied === item.slug ? "COPIED!" : "COPY LINK"}
                </button>
                <a
                  href={`/free/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-[#1c1c1c] text-white/40 hover:text-white hover:border-[#555] transition-all"
                  title="Open landing page"
                >
                  <ExternalLink size={14} />
                </a>
                <Link
                  to={`/admin/content/${item.id}/edit`}
                  className="p-2 border border-[#1c1c1c] text-white/40 hover:text-white hover:border-[#555] transition-all"
                  title="Edit"
                >
                  <Edit size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => toggleActive(item)}
                  disabled={pendingId === item.id}
                  className="p-2 text-white/40 hover:text-white transition-colors disabled:opacity-40"
                  title={item.active ? "Deactivate" : "Activate"}
                >
                  {item.active ? (
                    <ToggleRight size={20} className="text-[#E8192C]" />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  disabled={pendingId === item.id}
                  className="p-2 border border-[#1c1c1c] text-white/30 hover:text-[#E8192C] hover:border-[#E8192C]/40 transition-all disabled:opacity-40"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
