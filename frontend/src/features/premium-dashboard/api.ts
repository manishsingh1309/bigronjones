import { authHeaders } from "@/auth/api";
import { premiumDashboardMock } from "./mockData";
import type {
  CheckInInput,
  DashboardSummary,
  DailyFeedback,
  VideoModuleState,
} from "./types";

async function safeJson<T>(res: Response, fallback: T): Promise<T> {
  if (!res.ok) return fallback;
  try {
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function loadDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch("/api/dashboard/summary", {
    headers: await authHeaders(),
    credentials: "include",
  });
  const json = await safeJson<{ summary?: DashboardSummary }>(res, {
    summary: premiumDashboardMock,
  });
  return json.summary ?? premiumDashboardMock;
}

export async function submitCheckIn(payload: CheckInInput) {
  const res = await fetch("/api/dashboard/check-ins", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(payload),
  });
  return safeJson<{ success?: boolean; saved?: boolean; checkIn?: unknown }>(
    res,
    {
      success: false,
      saved: false,
    },
  );
}

export async function markEmailProgress(
  step: number,
  status: "sent" | "opened" | "read",
) {
  const res = await fetch("/api/dashboard/email-progress", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ step, status }),
  });
  return safeJson(res, { success: false, saved: false });
}

export async function loadVideoProgress(): Promise<{
  modules: VideoModuleState[];
  currentDay: number;
  completionPercent: number;
  completedDays: number[];
  watchedVideos: number[];
  unlockStatus: DashboardSummary["unlockStatus"];
}> {
  const res = await fetch("/api/dashboard/video-progress", {
    headers: await authHeaders(),
    credentials: "include",
  });
  return safeJson(res, {
    modules: [],
    currentDay: 1,
    completionPercent: 0,
    completedDays: [],
    watchedVideos: [],
    unlockStatus: [],
  });
}

export async function updateVideoProgress(payload: {
  dayNumber: number;
  watched?: boolean;
  completed?: boolean;
}) {
  const res = await fetch("/api/dashboard/video-progress", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(payload),
  });
  return safeJson(res, { success: false });
}

export async function loadDailyFeedback(): Promise<{
  feedback: DailyFeedback[];
}> {
  const res = await fetch("/api/dashboard/daily-feedback", {
    headers: await authHeaders(),
    credentials: "include",
  });
  return safeJson(res, { feedback: [] });
}

export async function submitDailyFeedback(payload: {
  dayNumber: number;
  mood: number;
  energy: number;
  understandingLevel: number;
  takeaway?: string;
  struggles?: string;
  questions?: string;
  commitmentScore: number;
  notes?: string;
}) {
  const res = await fetch("/api/dashboard/daily-feedback", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify(payload),
  });
  return safeJson(res, { success: false });
}
