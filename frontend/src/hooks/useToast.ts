
import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  cta?: { label: string; href: string };
};

type ToastStore = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
