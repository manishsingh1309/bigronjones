import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, AlertCircle, Check } from "lucide-react";
import AdminLayout from "@admin/components/AdminLayout";
import {
  adminApi,
  type ContentItem,
  type ContentType,
} from "@admin/api/adminApi";

const CONTENT_TYPES: Array<{ value: ContentType; label: string; emoji: string }> = [
  { value: "pdf", label: "PDF Guide", emoji: "📄" },
  { value: "ebook", label: "Ebook", emoji: "📚" },
  { value: "youtube", label: "YouTube Video", emoji: "▶️" },
  { value: "url", label: "External Link", emoji: "🔗" },
  { value: "file", label: "File Download", emoji: "📁" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

type FormState = {
  title: string;
  slug: string;
  description: string;
  type: ContentType;
  external_url: string;
  pdf_url: string;
  email_subject: string;
  cta_text: string;
  cover_image_url: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  type: "pdf",
  external_url: "",
  pdf_url: "",
  email_subject: "",
  cta_text: "",
  cover_image_url: "",
  active: true,
};

export default function AdminContentForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const siteUrl =
    (import.meta.env.VITE_SITE_URL as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "");

  useEffect(() => {
    if (!isEdit || !id) return;
    let mounted = true;
    adminApi
      .listContent()
      .then(({ items }) => {
        if (!mounted) return;
        const item = items.find((it) => it.id === id);
        if (!item) {
          setError("Content not found");
          return;
        }
        setForm({
          title: item.title,
          slug: item.slug,
          description: item.description,
          type: item.type,
          external_url: item.external_url || "",
          pdf_url: item.pdf_url || "",
          email_subject: item.email_subject || "",
          cta_text: item.cta_text || "",
          cover_image_url: item.cover_image_url || "",
          active: item.active,
        });
        setSlugTouched(true);
      })
      .catch((err: Error) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  function setTitle(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugify(title),
      email_subject:
        f.email_subject || `Your Free ${title} from BigRonJones`,
    }));
  }

  const needsFile = form.type === "pdf" || form.type === "ebook" || form.type === "file";
  const needsUrl = form.type === "youtube" || form.type === "url";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (needsUrl && !form.external_url.trim()) {
      setError("Enter the URL for this content type.");
      return;
    }
    if (needsFile && !file && !form.pdf_url) {
      setError("Upload a file for this content type.");
      return;
    }

    setSubmitting(true);

    try {
      let pdfUrl = form.pdf_url;

      // Upload file if a new one was picked
      if (file && needsFile) {
        setUploadProgress(0);
        const { publicUrl } = await adminApi.uploadFile(
          file,
          form.slug || slugify(form.title),
          (pct) => setUploadProgress(pct)
        );
        pdfUrl = publicUrl;
      }

      const payload: Partial<ContentItem> = {
        title: form.title.trim(),
        slug: form.slug || slugify(form.title),
        description: form.description.trim(),
        type: form.type,
        external_url: needsUrl ? form.external_url.trim() : null,
        pdf_url: needsFile ? pdfUrl || null : null,
        cover_image_url: form.cover_image_url.trim() || null,
        cta_text: form.cta_text.trim() || null,
        email_subject: form.email_subject.trim() || undefined,
        active: form.active,
      };

      if (isEdit && id) {
        await adminApi.updateContent({ ...payload, id });
      } else {
        await adminApi.createContent(payload);
      }

      navigate("/admin/content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <button
          type="button"
          onClick={() => navigate("/admin/content")}
          className="flex items-center gap-2 mb-6 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={12} /> Back to Content
        </button>

        <div className="mb-8">
          <p className="font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C] mb-1">
            {isEdit ? "EDIT" : "CREATE"}
          </p>
          <h1 className="font-['Bebas_Neue'] text-4xl text-white">
            {isEdit ? "EDIT CONTENT" : "NEW CONTENT"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Type picker */}
          <div>
            <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-3">
              CONTENT TYPE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONTENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  className={[
                    "py-3 px-4 text-left font-['DM_Sans'] text-sm border transition-all",
                    form.type === t.value
                      ? "border-[#E8192C] bg-[#E8192C]/10 text-white"
                      : "border-[#1c1c1c] text-white/40 hover:border-[#555] hover:text-white",
                  ].join(" ")}
                >
                  <span className="mr-2">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <Field label="TITLE" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Mass Gain Guide for Men 35+"
              className="w-full bg-[#0a0a0a] border border-[#1c1c1c] focus:border-[#E8192C] outline-none px-4 py-3.5 font-['DM_Sans'] text-white text-sm placeholder:text-white/20 transition-colors"
            />
          </Field>

          {/* Slug */}
          <Field label="SHAREABLE LINK SLUG">
            <div className="flex items-center gap-1 bg-[#0a0a0a] border border-[#1c1c1c] focus-within:border-[#E8192C] px-4 py-3.5 transition-colors">
              <span className="font-['DM_Mono'] text-[11px] text-white/30 shrink-0">
                {siteUrl}/free/
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
                }}
                placeholder="auto-from-title"
                className="flex-1 bg-transparent outline-none font-['DM_Mono'] text-[11px] text-[#E8192C] min-w-0"
              />
            </div>
          </Field>

          {/* Description */}
          <Field label="DESCRIPTION" required>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              placeholder="What will users get? One or two compelling sentences."
              className="w-full bg-[#0a0a0a] border border-[#1c1c1c] focus:border-[#E8192C] outline-none px-4 py-3.5 font-['DM_Sans'] text-white text-sm placeholder:text-white/20 transition-colors resize-none"
            />
          </Field>

          {/* File upload — for file/pdf/ebook types */}
          {needsFile && (
            <Field
              label={isEdit && form.pdf_url ? "REPLACE FILE (OPTIONAL)" : "UPLOAD FILE"}
              required={!isEdit || !form.pdf_url}
            >
              <label className="flex flex-col items-center justify-center w-full py-10 border-2 border-dashed border-[#1c1c1c] hover:border-[#E8192C] transition-colors cursor-pointer bg-[#0a0a0a]">
                <input
                  type="file"
                  accept=".pdf,.epub,.doc,.docx,.zip,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
                {file ? (
                  <div className="text-center">
                    <p className="font-['DM_Sans'] text-white text-sm font-medium">
                      {file.name}
                    </p>
                    <p className="font-['DM_Mono'] text-[10px] text-white/30 mt-1">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ) : isEdit && form.pdf_url ? (
                  <div className="text-center">
                    <Check size={20} className="text-[#E8192C] mx-auto mb-2" />
                    <p className="font-['DM_Sans'] text-white/60 text-sm">
                      File already uploaded
                    </p>
                    <p className="font-['DM_Mono'] text-[9px] tracking-wider text-white/30 mt-1 truncate max-w-xs">
                      {form.pdf_url.split("/").pop()}
                    </p>
                    <p className="font-['DM_Mono'] text-[9px] tracking-wider text-white/30 mt-2">
                      Click to replace
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload size={20} className="text-white/40 mx-auto mb-2" />
                    <p className="font-['DM_Sans'] text-white/40 text-sm mb-1">
                      Click to upload
                    </p>
                    <p className="font-['DM_Mono'] text-[9px] tracking-wider text-white/20">
                      PDF, EPUB, DOC, ZIP, IMG · Max 50MB
                    </p>
                  </div>
                )}
              </label>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 h-1 bg-[#1c1c1c] overflow-hidden">
                  <div
                    className="h-full bg-[#E8192C] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </Field>
          )}

          {/* External URL — for youtube/url types */}
          {needsUrl && (
            <Field
              label={form.type === "youtube" ? "YOUTUBE URL" : "EXTERNAL URL"}
              required
            >
              <input
                type="url"
                value={form.external_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, external_url: e.target.value }))
                }
                placeholder={
                  form.type === "youtube"
                    ? "https://youtube.com/watch?v=..."
                    : "https://..."
                }
                className="w-full bg-[#0a0a0a] border border-[#1c1c1c] focus:border-[#E8192C] outline-none px-4 py-3.5 font-['DM_Sans'] text-white text-sm placeholder:text-white/20 transition-colors"
              />
              {form.type === "youtube" && (
                <p className="font-['DM_Mono'] text-[9px] tracking-wider text-white/25 mt-2">
                  Unlisted videos work too — paste the full watch URL.
                </p>
              )}
            </Field>
          )}

          {/* Cover image (optional) */}
          <Field label="COVER IMAGE URL (OPTIONAL)">
            <input
              type="url"
              value={form.cover_image_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, cover_image_url: e.target.value }))
              }
              placeholder="https://... (used for OG share preview)"
              className="w-full bg-[#0a0a0a] border border-[#1c1c1c] focus:border-[#E8192C] outline-none px-4 py-3.5 font-['DM_Sans'] text-white text-sm placeholder:text-white/20 transition-colors"
            />
          </Field>

          {/* Email subject */}
          <Field label="EMAIL SUBJECT LINE" required>
            <input
              type="text"
              value={form.email_subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, email_subject: e.target.value }))
              }
              required
              placeholder="Your Free Mass Gain Guide is here"
              className="w-full bg-[#0a0a0a] border border-[#1c1c1c] focus:border-[#E8192C] outline-none px-4 py-3.5 font-['DM_Sans'] text-white text-sm placeholder:text-white/20 transition-colors"
            />
          </Field>

          {/* CTA */}
          <Field label="LANDING-PAGE BUTTON LABEL (OPTIONAL)">
            <input
              type="text"
              value={form.cta_text}
              onChange={(e) =>
                setForm((f) => ({ ...f, cta_text: e.target.value }))
              }
              placeholder="GET INSTANT ACCESS"
              className="w-full bg-[#0a0a0a] border border-[#1c1c1c] focus:border-[#E8192C] outline-none px-4 py-3.5 font-['DM_Sans'] text-white text-sm placeholder:text-white/20 transition-colors"
            />
          </Field>

          {/* Active toggle */}
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="accent-[#E8192C] w-4 h-4"
            />
            <span className="font-['DM_Sans'] text-sm text-white/70">
              Active — landing page is live and accepting leads
            </span>
          </label>

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-[#E8192C]/10 border border-[#E8192C]/30">
              <AlertCircle size={14} className="text-[#E8192C] shrink-0 mt-0.5" />
              <p className="font-['DM_Sans'] text-sm text-[#E8192C]">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-[#E8192C] text-white font-['Bebas_Neue'] text-xl tracking-widest hover:bg-[#b50f1f] transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {uploadProgress > 0 && uploadProgress < 100
                    ? `UPLOADING ${uploadProgress}%`
                    : "SAVING..."}
                </>
              ) : isEdit ? (
                "SAVE CHANGES"
              ) : (
                "CREATE CONTENT"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/content")}
              className="px-6 py-4 border border-[#1c1c1c] text-white/60 font-['DM_Mono'] text-[10px] tracking-[0.15em] uppercase hover:border-[#555] hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
        {label} {required && <span className="text-[#E8192C]">*</span>}
      </label>
      {children}
    </div>
  );
}
