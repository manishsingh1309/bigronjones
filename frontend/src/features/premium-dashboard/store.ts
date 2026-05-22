import { create } from "zustand";
import {
  loadDashboardSummary,
  loadVideoProgress,
  markEmailProgress,
  submitCheckIn,
  submitDailyFeedback,
  updateVideoProgress,
} from "./api";
import { premiumDashboardMock } from "./mockData";
import type { CheckInInput, DashboardSummary } from "./types";

type DashboardStore = {
  summary: DashboardSummary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  addCheckIn: (payload: CheckInInput) => Promise<void>;
  updateEmailProgress: (
    step: number,
    status: "sent" | "opened" | "read",
  ) => Promise<void>;
  markVideoProgress: (payload: {
    dayNumber: number;
    watched?: boolean;
    completed?: boolean;
  }) => Promise<void>;
  submitFeedback: (payload: {
    dayNumber: number;
    mood: number;
    energy: number;
    understandingLevel: number;
    takeaway?: string;
    struggles?: string;
    questions?: string;
    commitmentScore: number;
    notes?: string;
  }) => Promise<void>;
};

export const usePremiumDashboardStore = create<DashboardStore>((set, get) => ({
  summary: premiumDashboardMock,
  loading: true,
  error: null,
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const summary = await loadDashboardSummary();
      set({ summary, loading: false });
    } catch (error) {
      set({
        summary: premiumDashboardMock,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load dashboard",
      });
    }
  },
  refreshProgress: async () => {
    try {
      const progress = await loadVideoProgress();
      const current = get().summary;
      set({
        summary: {
          ...current,
          modules: progress.modules,
          activeDay: progress.currentDay,
          currentDay: progress.currentDay,
          completionPercent: progress.completionPercent,
          completedDays: progress.completedDays,
          watchedVideos: progress.watchedVideos,
          unlockStatus: progress.unlockStatus,
        },
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load progress",
      });
    }
  },
  addCheckIn: async (payload) => {
    const result = await submitCheckIn(payload);
    if (result.success) {
      const next = await loadDashboardSummary();
      set({ summary: next, error: null });
      return;
    }
    const current = get().summary;
    set({
      summary: {
        ...current,
        checkIns: [
          {
            id: `local-${Date.now()}`,
            user_id: current.user.id,
            trial_day: payload.trialDay || current.activeDay,
            mood: payload.mood,
            energy: payload.energy,
            sleep_quality: payload.sleepQuality,
            soreness: payload.soreness,
            performance: payload.performance,
            weight: payload.weight ?? null,
            waist: payload.waist ?? null,
            hr: payload.hr ?? null,
            hrv: payload.hrv ?? null,
            notes: payload.notes ?? null,
            created_at: new Date().toISOString(),
          },
          ...current.checkIns,
        ],
      },
    });
  },
  updateEmailProgress: async (step, status) => {
    await markEmailProgress(step, status);
    const current = get().summary;
    set({
      summary: {
        ...current,
        emailProgress: current.emailProgress.map((item) =>
          item.step === step
            ? {
                ...item,
                status,
                openedAt:
                  status === "opened" || status === "read"
                    ? item.openedAt || new Date().toISOString()
                    : item.openedAt,
                readAt:
                  status === "read"
                    ? item.readAt || new Date().toISOString()
                    : item.readAt,
              }
            : item,
        ),
      },
    });
  },
  markVideoProgress: async (payload) => {
    const result = await updateVideoProgress(payload);
    if (result.success) {
      const next = await loadDashboardSummary();
      set({ summary: next, error: null });
    }
  },
  submitFeedback: async (payload) => {
    const result = await submitDailyFeedback(payload);
    if (result.success) {
      const next = await loadDashboardSummary();
      set({ summary: next, error: null });
    }
  },
}));
