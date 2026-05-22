import {
  defaultVideoModules,
  type CoachingDashboardState,
  type CoachingNote,
  type DailyFeedback,
  type VideoModuleState,
} from "./coachingProgress";

export type DashboardRole = "user" | "admin" | "super_admin";

export type DashboardUserModel = {
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

export type CheckInModel = {
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

export type WorkoutExercise = {
  name: string;
  sets: string;
  reps: string;
  tempo?: string;
};

export type WorkoutModel = {
  id: string;
  programType: "gym" | "home";
  day: number;
  title: string;
  coachNotes: string;
  videoUrl?: string | null;
  exercises: WorkoutExercise[];
  completed: boolean;
};

export type EmailProgressModel = {
  id: string;
  step: number;
  subject: string;
  sentAt: string;
  openedAt?: string | null;
  readAt?: string | null;
  status: "queued" | "sent" | "opened" | "read";
};

export type AnalyticsModel = {
  labels: string[];
  energy: number[];
  mood: number[];
  performance: number[];
  checkInConsistency: number[];
  weight: Array<number | null>;
};

export type PremiumDashboardSummary = {
  user: DashboardUserModel;
  modules: VideoModuleState[];
  activeDay: number;
  completionPercent: number;
  currentDay?: number;
  completedDays?: number[];
  watchedVideos?: number[];
  unlockStatus?: CoachingDashboardState["unlockStatus"];
  dailyFeedback?: DailyFeedback[];
  coachNotes?: CoachingNote[];
  checkIns: CheckInModel[];
  workouts: WorkoutModel[];
  emailProgress: EmailProgressModel[];
  analytics: AnalyticsModel;
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

const now = new Date().toISOString();
const baseModules = defaultVideoModules();

export const premiumDashboardMock: PremiumDashboardSummary = {
  user: {
    id: "demo-user",
    email: "athlete@example.com",
    name: "Jordan",
    role: "user",
    paymentStatus: "paid",
    bookingCompleted: true,
    bookingTime: now,
    trialStartDate: now,
    trialEndDate: now,
    trialCompletedAt: null,
    streakDays: 4,
    progressPercent: 58,
  },
  modules: baseModules.map((module, index) => ({
    ...module,
    watched: index < 4,
    completed: index < 3,
    unlocked: index < 4,
    feedbackSubmitted: index < 3,
    canSubmitFeedback: index === 3,
    watchedAt: now,
    completedAt: index < 3 ? now : null,
    feedbackSubmittedAt: index < 3 ? now : null,
  })),
  activeDay: 4,
  completionPercent: 58,
  currentDay: 4,
  completedDays: [1, 2, 3],
  watchedVideos: [1, 2, 3, 4],
  unlockStatus: baseModules.map((module) => ({
    day_number: module.day_number,
    unlocked: module.day_number <= 4,
    completed: module.day_number <= 3,
    feedbackSubmitted: module.day_number <= 3,
    lockedReason:
      module.day_number <= 4
        ? null
        : "Complete the previous day and submit feedback to unlock.",
  })),
  dailyFeedback: [
    {
      id: "df-1",
      user_id: "demo-user",
      day_number: 1,
      mood: 7,
      energy: 7,
      understanding_level: 8,
      takeaway: "The first win is getting the plan on paper.",
      struggles: "Time management",
      questions: "How much cardio is too much?",
      commitment_score: 9,
      notes: "Move early in the day.",
      created_at: now,
      updated_at: now,
    },
  ],
  coachNotes: [
    {
      id: "note-1",
      user_id: "demo-user",
      admin_id: "coach-1",
      note: "Strong momentum. Keep the guardrails tight.",
      label: "high-potential",
      created_at: now,
    },
  ],
  checkIns: [],
  workouts: [
    {
      id: "gym-1",
      programType: "gym",
      day: 4,
      title: "Lower Body Strength",
      coachNotes: "Keep rest honest. No ego sets. Move crisp and controlled.",
      videoUrl:
        "https://www.youtube.com/embed/yTAPv6f8FfU?rel=0&modestbranding=1",
      completed: false,
      exercises: [
        { name: "Trap Bar Deadlift", sets: "4", reps: "5" },
        { name: "Rear-Foot Elevated Split Squat", sets: "3", reps: "8/side" },
        { name: "Lat Pulldown", sets: "3", reps: "10" },
      ],
    },
    {
      id: "home-1",
      programType: "home",
      day: 4,
      title: "Home Conditioning Circuit",
      coachNotes: "Short rest. Keep the heart rate in check and finish clean.",
      videoUrl:
        "https://www.youtube.com/embed/KwoI0SgTJzY?rel=0&modestbranding=1",
      completed: true,
      exercises: [
        { name: "Air Squat", sets: "4", reps: "15" },
        { name: "Push-Up", sets: "4", reps: "10" },
        { name: "Plank", sets: "4", reps: "30s" },
      ],
    },
  ],
  emailProgress: [
    {
      id: "e1",
      step: 1,
      subject: "Welcome + Orientation",
      sentAt: now,
      status: "read",
      openedAt: now,
      readAt: now,
    },
    {
      id: "e2",
      step: 2,
      subject: "Training Rules of Engagement",
      sentAt: now,
      status: "opened",
      openedAt: now,
    },
    {
      id: "e3",
      step: 3,
      subject: "Recovery Doctrine",
      sentAt: now,
      status: "sent",
    },
    {
      id: "e4",
      step: 4,
      subject: "Performance Review Checkpoint",
      sentAt: now,
      status: "queued",
    },
    {
      id: "e5",
      step: 5,
      subject: "Final Review Prep",
      sentAt: now,
      status: "queued",
    },
  ],
  analytics: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    energy: [6, 7, 7, 8, 8, 9, 8],
    mood: [6, 6, 7, 7, 8, 8, 9],
    performance: [5, 6, 6, 7, 7, 8, 8],
    checkInConsistency: [1, 2, 2, 3, 4, 5, 5],
    weight: [null, 201, 200.4, 200.1, 199.8, 199.3, 199],
  },
  discoveryCall: {
    booked: true,
    scheduledAt: now,
    eventId: "evt_demo_123",
    instructions: [
      "Join 5 minutes early.",
      "Bring your check-in notes.",
      "Have your training questions ready.",
    ],
  },
  finalReview: {
    title: "Final Review Scheduled",
    coachNotes:
      "Confirm results, discuss next phase, and lock the continuation path.",
    userNotes: "Keep consistency high through the last two days.",
    feedbackEnabled: true,
  },
};
