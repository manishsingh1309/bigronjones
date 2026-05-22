
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/useToast";

const ICONS = {
  success: Check,
  error: AlertTriangle,
  info: Info,
} as const;

const ACCENTS = {
  success: "border-l-[#E8192C]",
  error: "border-l-amber-500",
  info: "border-l-white/40",
} as const;

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed top-24 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto flex items-start gap-3 border border-[#1a1a1a] border-l-2 ${ACCENTS[t.variant]} bg-[#0f0f0f] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.5)]`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center ${
                  t.variant === "success"
                    ? "bg-[#E8192C]"
                    : t.variant === "error"
                    ? "bg-amber-500/20"
                    : "bg-white/10"
                }`}
              >
                <Icon
                  size={14}
                  strokeWidth={2.5}
                  className={
                    t.variant === "success" ? "text-white" : "text-white"
                  }
                />
              </span>
              <div className="flex-1">
                <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-1 font-['DM_Sans'] text-[13px] leading-snug text-white/65">
                    {t.description}
                  </p>
                )}
                {t.cta && (
                  <Link
                    to={t.cta.href}
                    onClick={() => dismiss(t.id)}
                    className="mt-2 inline-flex items-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-[#E8192C] hover:text-white"
                  >
                    {t.cta.label} →
                  </Link>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="text-white/40 transition-colors hover:text-white"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
