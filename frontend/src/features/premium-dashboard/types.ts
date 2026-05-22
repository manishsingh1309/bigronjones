export type DashboardRole = "user" | "admin" | "super_admin";

export type DashboardUser = {
  id: string;
  email: string;
  name: string;
  role: DashboardRole;
  paymentStatus: "pending" | "paid" | "refunded";
  bookingCompleted: boolean;
  bookingTime: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialCompletedAt: string | null;
  streakDays: number;
  progressPercent: number;
};

export type CheckIn = {
  id: string;
  user_id: string;
  trial_day: number;
  mood: number;
  energy: number;
  sleep_quality: number;
  soreness: number;
  performance: number;
  weight?: number | null;
  waist?: number | null;
  hr?: number | null;
  hrv?: number | null;
  notes?: string | null;
  created_at: string;
};

export type Workout = {
  id: string;
  programType: "gym" | "home";
  day: number;
  title: string;
  coachNotes: string;
  videoUrl?: string | null;
  completed: boolean;
  exercises: Array<{
    name: string;
    sets: string;
    reps: string;
    tempo?: string;
  }>;
};

export type EmailProgress = {
  id: string;
  step: number;
  subject: string;
  sentAt: string;
  openedAt?: string | null;
  readAt?: string | null;
  status: "queued" | "sent" | "opened" | "read";
};

export type Analytics = {
  labels: string[];
  energy: number[];
  mood: number[];
  performance: number[];
  checkInConsistency: number[];
  weight: Array<number | null>;
};

export type VideoModule = {
  id: string;
  day_number: number;
  title: string;
  description: string;
  youtube_url: string;
  resources: string[];
  created_at: string;
};

export type VideoModuleState = VideoModule & {
  watched: boolean;
  completed: boolean;
  unlocked: boolean;
  feedbackSubmitted: boolean;
  canSubmitFeedback: boolean;
  watchedAt: string | null;
  completedAt: string | null;
  feedbackSubmittedAt: string | null;
};

export type DailyFeedback = {
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
  sentiment_score?: number | null;
  created_at: string;
  updated_at?: string | null;
};

export type CoachNote = {
  id: string;
  user_id: string;
  admin_id: string;
  note: string;
  label: "general" | "high-risk" | "high-potential";
  created_at: string;
};

export type UnlockStatus = {
  day_number: number;
  unlocked: boolean;
  completed: boolean;
  feedbackSubmitted: boolean;
  lockedReason: string | null;
};

export type DashboardSummary = {
  user: DashboardUser;
  modules: VideoModuleState[];
  activeDay: number;
  currentDay?: number;
  completionPercent: number;
  completedDays?: number[];
  watchedVideos?: number[];
  unlockStatus?: UnlockStatus[];
  dailyFeedback?: DailyFeedback[];
  coachNotes?: CoachNote[];
  checkIns: CheckIn[];
  workouts: Workout[];
  emailProgress: EmailProgress[];
  analytics: Analytics;
  discoveryCall: {
    booked: boolean;
    scheduledAt: string | null;
    eventId: string | null;
    instructions: string[];
  };
  finalReview: {
    title: string;
    coachNotes: string;
    userNotes: string;
    feedbackEnabled: boolean;
  };
};

export type CheckInInput = {
  mood: number;
  energy: number;
  sleepQuality: number;
  soreness: number;
  performance: number;
  weight?: number | null;
  waist?: number | null;
  hr?: number | null;
  hrv?: number | null;
  notes?: string | null;
  trialDay?: number;
};
