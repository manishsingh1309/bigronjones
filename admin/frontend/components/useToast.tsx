import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastState = { id: number; kind: ToastKind; message: string } | null;

// Minimal in-component toast — no global provider needed. Each admin page
// owns one queue. Auto-dismisses after 4s; manual close button too.
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ id: Date.now(), kind, message });
      timerRef.current = setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const view = toast ? <ToastView toast={toast} onClose={clear} /> : null;
  return {
    toast: view,
    success: (m: string) => show("success", m),
    error: (m: string) => show("error", m),
    info: (m: string) => show("info", m),
  };
}

function ToastView({
  toast,
  onClose,
}: {
  toast: { id: number; kind: ToastKind; message: string };
  onClose: () => void;
}) {
  const Icon = toast.kind === "error" ? AlertCircle : CheckCircle;
  const accent =
    toast.kind === "error"
      ? "border-[#E8192C]/40 text-[#E8192C]"
      : toast.kind === "success"
        ? "border-emerald-400/30 text-emerald-300"
        : "border-white/20 text-white/80";
  return (
    <div className="fixed bottom-6 right-6 z-[2000] flex items-center gap-3 border bg-[#0a0a0a] px-4 py-3 shadow-2xl">
      <div
        className={"flex items-center gap-2 border-l-2 pl-3 pr-2 " + accent}
      >
        <Icon size={16} />
        <span className="font-['DM_Sans'] text-sm">{toast.message}</span>
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="text-white/40 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}
