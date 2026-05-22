// Admin API client. Every call here attaches the current Supabase
// access token as a bearer header — the server enforces ADMIN_EMAILS.
import { supabase } from "@/auth/supabase";

export type ContentType = "pdf" | "ebook" | "youtube" | "url" | "file";

export type ContentItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: ContentType;
  pdf_url: string | null;
  external_url: string | null;
  cta_text: string | null;
  cover_image_url: string | null;
  category: string | null;
  email_subject: string | null;
  active: boolean;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string | null;
};

export type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  lead_magnet_id: string;
  lead_magnet_slug: string;
  source: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  status: string | null;
  pdf_sent: boolean;
  pdf_sent_at: string | null;
  created_at: string;
  lead_magnets: { title: string; type: ContentType } | null;
};

// ── Trial-admin shared types ─────────────────────────────────────────────
export type TrialUserStatus =
  | "lead"
  | "awaiting_calendly"
  | "active"
  | "completed"
  | "converted";

export type TrialAdminUser = {
  id: string;
  email: string;
  name: string;
  program_type: string | null;
  payment_status: string | null;
  has_booked_calendly: boolean | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_completed_at: string | null;
  priority_window_expires_at: string | null;
  converted_to_paid: boolean | null;
  created_at: string;
  status: TrialUserStatus;
  trialDay: number | null;
};

export type TrialAdminCompletion = {
  id: string;
  user_id: string;
  trial_day: number;
  watched_video: boolean;
  completed_workout: boolean;
  logged_nutrition: boolean;
  reviewed_notes: boolean;
  energy_rating: number | null;
  difficulty_rating: number | null;
  overall_feeling: string | null;
  feedback_text: string | null;
  ron_viewed: boolean;
  ron_reply: string | null;
  ron_replied_at: string | null;
  completed_at: string;
};

export type TrialAdminMetric = {
  id: string;
  metric_date: string;
  trial_day: number | null;
  sleep_quality: number;
  soreness_level: number;
  energy_level: number;
  mood: number | null;
  workout_type: string | null;
  notes: string | null;
};

export type TrialAdminActivity = {
  id: string;
  activity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user_id: string;
  user?: { name: string; email: string } | null;
};

export type TrialAdminFeedbackItem = TrialAdminCompletion & {
  users: {
    id: string;
    name: string;
    email: string;
    program_type: string | null;
  };
};

export type TrialAdminStatsResponse = {
  stats: {
    totalUsers: number;
    paidUsers: number;
    activeTrials: number;
    completedTrials: number;
    purchasedLast7d: number;
    completionsTotal: number;
    feedbackPending: number;
    feedbackLast24h: number;
  };
  recentActivity: TrialAdminActivity[];
  recentFeedback: TrialAdminFeedbackItem[];
};

export type TrialAdminUserListResponse = {
  users: TrialAdminUser[];
  counts: Partial<Record<TrialUserStatus, number>>;
  total: number;
};

export type TrialAdminUserDetailResponse = {
  user: TrialAdminUser & {
    stripe_session_id: string | null;
    calendly_event_id: string | null;
  };
  completions: TrialAdminCompletion[];
  metrics: TrialAdminMetric[];
  activity: TrialAdminActivity[];
};

export type TrialAdminFeedbackResponse = {
  feedback: TrialAdminFeedbackItem[];
  filter: string;
};

export type SuperAdminDashboardResponse = {
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    paidUsers: number;
    superAdmins: number;
    completedTrials: number;
    unlockedDayRows: number;
    feedbackCount: number;
    feedbackRecent7d: number;
  };
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string | null;
    payment_status: string | null;
    has_booked_calendly: boolean | null;
    trial_start_date: string | null;
    trial_end_date: string | null;
    trial_completed_at: string | null;
    converted_to_paid: boolean | null;
    created_at: string;
  }>;
  recentFeedback: Array<{
    id: string;
    user_id: string;
    day_number: number;
    mood: number;
    energy: number;
    understanding_level: number;
    takeaway: string | null;
    struggles: string | null;
    questions: string | null;
    commitment_score: number;
    notes: string | null;
    created_at: string;
    users?: {
      id: string;
      name: string;
      email: string;
      role: string | null;
    } | null;
  }>;
  feedbackTrend: Array<{
    day: number;
    mood: number;
    energy: number;
    understandingLevel: number;
    commitmentScore: number;
  }>;
  progressTrend: Array<{
    day: number;
    watched: number;
    completed: number;
    unlocked: number;
  }>;
  coachNotes: Array<{
    id: string;
    user_id: string;
    admin_id: string;
    note: string;
    label: string;
    created_at: string;
  }>;
};

export type Stats = {
  totalContent: number;
  activeContent: number;
  totalLeads: number;
  leadsLast7d: number;
  totalViews: number;
  totalDownloads: number;
  recentLeads: Array<{
    id: string;
    full_name: string;
    email: string;
    lead_magnet_slug: string;
    created_at: string;
    lead_magnets: { title: string } | null;
  }>;
};

async function authedFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export const adminApi = {
  async listContent(): Promise<{ items: ContentItem[] }> {
    const res = await authedFetch("/api/admin/content");
    return jsonOrThrow(res);
  },

  async createContent(
    payload: Partial<ContentItem>,
  ): Promise<{ item: ContentItem }> {
    const res = await authedFetch("/api/admin/content", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res);
  },

  async updateContent(
    payload: Partial<ContentItem> & { id: string },
  ): Promise<{ item: ContentItem }> {
    const res = await authedFetch("/api/admin/content", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res);
  },

  async deleteContent(id: string): Promise<{ ok: true }> {
    const res = await authedFetch("/api/admin/content", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    return jsonOrThrow(res);
  },

  async listLeads(
    opts: {
      contentId?: string;
      q?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{
    items: Lead[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    if (opts.contentId) params.set("content_id", opts.contentId);
    if (opts.q) params.set("q", opts.q);
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.offset) params.set("offset", String(opts.offset));
    const qs = params.toString();
    const res = await authedFetch(`/api/admin/leads${qs ? `?${qs}` : ""}`);
    return jsonOrThrow(res);
  },

  async deleteLeads(ids: string[]): Promise<{ ok: true; deleted: number }> {
    const res = await authedFetch("/api/admin/leads", {
      method: "DELETE",
      body: JSON.stringify(ids.length === 1 ? { id: ids[0] } : { ids }),
    });
    return jsonOrThrow(res);
  },

  async deleteFeedback(
    ids: string[],
  ): Promise<{ ok: true; deleted: number }> {
    const res = await authedFetch("/api/admin/trial-feedback", {
      method: "DELETE",
      body: JSON.stringify(ids.length === 1 ? { id: ids[0] } : { ids }),
    });
    return jsonOrThrow(res);
  },

  async deleteTrialUser(id: string): Promise<{ ok: true; id: string }> {
    const res = await authedFetch("/api/admin/trial-users", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    return jsonOrThrow(res);
  },

  async stats(): Promise<Stats> {
    const res = await authedFetch("/api/admin/stats");
    return jsonOrThrow(res);
  },

  // ── Trial admin ────────────────────────────────────────────────────────
  async trialStats(): Promise<TrialAdminStatsResponse> {
    const res = await authedFetch("/api/admin/trial-stats");
    return jsonOrThrow(res);
  },
  async trialUsers(
    opts: {
      search?: string;
      status?: string;
    } = {},
  ): Promise<TrialAdminUserListResponse> {
    const params = new URLSearchParams();
    if (opts.search) params.set("search", opts.search);
    if (opts.status) params.set("status", opts.status);
    const qs = params.toString();
    const res = await authedFetch(
      `/api/admin/trial-users${qs ? `?${qs}` : ""}`,
    );
    return jsonOrThrow(res);
  },
  async trialUser(id: string): Promise<TrialAdminUserDetailResponse> {
    const res = await authedFetch(
      `/api/admin/trial-users?id=${encodeURIComponent(id)}`,
    );
    return jsonOrThrow(res);
  },
  async trialFeedback(
    status: "all" | "unread" | "replied" | "unreplied" = "all",
  ): Promise<TrialAdminFeedbackResponse> {
    const res = await authedFetch(`/api/admin/trial-feedback?status=${status}`);
    return jsonOrThrow(res);
  },
  async trialReply(payload: {
    completionId: string;
    reply?: string;
    viewed?: boolean;
  }): Promise<{ success: boolean }> {
    const res = await authedFetch("/api/admin/trial-reply", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res);
  },
  async trialMarkRead(completionId: string): Promise<{ success: boolean }> {
    const res = await authedFetch("/api/admin/trial-reply", {
      method: "PATCH",
      body: JSON.stringify({ completionId, viewed: true }),
    });
    return jsonOrThrow(res);
  },

  async superDashboard(): Promise<SuperAdminDashboardResponse> {
    const res = await authedFetch("/api/admin/super-dashboard");
    return jsonOrThrow(res);
  },

  async coachNotes(
    userId?: string,
  ): Promise<{ notes: SuperAdminDashboardResponse["coachNotes"] }> {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await authedFetch(`/api/admin/coach-notes${params}`);
    return jsonOrThrow(res);
  },

  async addCoachNote(payload: {
    userId: string;
    note: string;
    label?: "general" | "high-risk" | "high-potential";
  }): Promise<{ note: SuperAdminDashboardResponse["coachNotes"][number] }> {
    const res = await authedFetch("/api/admin/coach-notes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return jsonOrThrow(res);
  },

  async signUploadUrl(
    filename: string,
    slug?: string,
  ): Promise<{
    uploadUrl: string;
    token: string;
    path: string;
    publicUrl: string;
  }> {
    const res = await authedFetch("/api/admin/upload-url", {
      method: "POST",
      body: JSON.stringify({ filename, slug }),
    });
    return jsonOrThrow(res);
  },

  async uploadFile(
    file: File,
    slug?: string,
    onProgress?: (pct: number) => void,
  ): Promise<{ publicUrl: string; path: string }> {
    const { uploadUrl, token, path, publicUrl } = await this.signUploadUrl(
      file.name,
      slug,
    );
    // Use Supabase's signed-upload PUT contract.
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else
          reject(
            new Error(
              `Upload failed (HTTP ${xhr.status}): ${xhr.responseText}`,
            ),
          );
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
    return { publicUrl, path };
  },
};

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist =
    (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || "";
  return allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}
