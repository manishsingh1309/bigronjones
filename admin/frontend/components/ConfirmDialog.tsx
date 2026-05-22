import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 px-4"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md border border-[#1c1c1c] bg-[#0a0a0a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          {destructive && (
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-[#E8192C]"
            />
          )}
          <div>
            <p className="mb-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
              {destructive ? "Destructive action" : "Confirm"}
            </p>
            <h2 className="font-['Bebas_Neue'] text-2xl text-white">{title}</h2>
          </div>
        </div>
        <div className="mb-6 font-['DM_Sans'] text-sm leading-relaxed text-white/70">
          {message}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="border border-[#1c1c1c] px-5 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 transition-colors hover:border-[#3a3a3a] hover:text-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={
              "px-5 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white transition-colors disabled:opacity-60 " +
              (destructive
                ? "bg-[#E8192C] hover:bg-[#b50f1f]"
                : "bg-white/10 hover:bg-white/15")
            }
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
