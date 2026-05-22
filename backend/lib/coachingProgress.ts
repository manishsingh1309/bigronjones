export type CoachingRole = "user" | "admin" | "super_admin";

export type VideoModule = {
  id: string;
  day_number: number;
  title: string;
  description: string;
  youtube_url: string;
  resources: string[];
  created_at: string;
};

export type UserVideoProgress = {
  id: string;
  user_id: string;
  day_number: number;
  watched: boolean;
  completed: boolean;
  unlocked: boolean;
  completed_at: string | null;
  watched_at: string | null;
  unlocked_at: string | null;
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
  created_at: string;
  updated_at?: string | null;
};

export type CoachingNote = {
  id: string;
  user_id: string;
  admin_id: string;
  note: string;
  label: "general" | "high-risk" | "high-potential";
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

export type CoachingDashboardState = {
  modules: VideoModuleState[];
  currentDay: number;
  completionPercent: number;
  completedDays: number[];
  watchedVideos: number[];
  unlockStatus: Array<{
    day_number: number;
    unlocked: boolean;
    completed: boolean;
    feedbackSubmitted: boolean;
    lockedReason: string | null;
  }>;
};

const VIDEO_URLS = [
  "https://www.youtube.com/embed/KwoI0SgTJzY?rel=0&modestbranding=1",
  "https://www.youtube.com/embed/yTAPv6f8FfU?rel=0&modestbranding=1",
  "https://www.youtube.com/embed/M-hR9CDcQng?rel=0&modestbranding=1",
  "https://www.youtube.com/embed/Z9f4p1oXJx0?rel=0&modestbranding=1",
  "https://www.youtube.com/embed/qg0VQY0q5YQ?rel=0&modestbranding=1",
  "https://www.youtube.com/embed/3s1d8w2uPjA?rel=0&modestbranding=1",
  "https://www.youtube.com/embed/xg5p6mYb6j0?rel=0&modestbranding=1",
];

const MODULE_TITLES = [
  "Foundation Reset",
  "Energy Architecture",
  "Strength Command",
  "Recovery Doctrine",
  "Consistency Systems",
  "Progressive Overload",
  "Final Integration",
];

const MODULE_DESCRIPTIONS = [
  "Set your standards, sharpen the first win, and establish the baseline.",
  "Build the energy habits that drive output without burning you out.",
  "Train with intent, protect joints, and earn every rep.",
  "Use sleep, stress, and soreness as feedback instead of noise.",
  "Lock in the daily routines that make success inevitable.",
  "Push forward without breaking recovery or rhythm.",
  "Review the full week, capture the lesson, and set the next phase.",
];

export function defaultVideoModules(): VideoModule[] {
  const now = new Date().toISOString();
  return Array.from({ length: 7 }, (_, index) => ({
    id: `day-${index + 1}`,
    day_number: index + 1,
    title: MODULE_TITLES[index],
    description: MODULE_DESCRIPTIONS[index],
    youtube_url: VIDEO_URLS[index],
    resources: [
      `Day ${index + 1} notes`,
      "Save your takeaways before the next unlock.",
      index === 6 ? "Download your completion certificate." : "",
    ].filter(Boolean),
    created_at: now,
  }));
}

export function buildCoachingDashboardState({
  modules,
  progressRows,
  feedbackRows,
}: {
  modules: VideoModule[];
  progressRows: UserVideoProgress[];
  feedbackRows: DailyFeedback[];
}): CoachingDashboardState {
  const progressByDay = new Map(
    progressRows.map((row) => [row.day_number, row]),
  );
  const feedbackByDay = new Map(
    feedbackRows.map((row) => [row.day_number, row]),
  );
  const moduleStates: VideoModuleState[] = [];
  const completedDays: number[] = [];
  const watchedVideos: number[] = [];

  let unlockedThrough = 1;
  const orderedModules = [...modules].sort(
    (a, b) => a.day_number - b.day_number,
  );

  for (const module of orderedModules) {
    const progress = progressByDay.get(module.day_number);
    const feedback = feedbackByDay.get(module.day_number);
    const watched = !!progress?.watched;
    const completed = !!progress?.completed && !!feedback;
    const unlocked =
      module.day_number === 1 ||
      !!progress?.unlocked ||
      module.day_number <= unlockedThrough;
    const feedbackSubmitted = !!feedback;
    const canSubmitFeedback = watched && completed !== true && unlocked;

    if (watched) watchedVideos.push(module.day_number);
    if (completed) completedDays.push(module.day_number);

    moduleStates.push({
      ...module,
      watched,
      completed,
      unlocked,
      feedbackSubmitted,
      canSubmitFeedback,
      watchedAt: progress?.watched_at || null,
      completedAt: progress?.completed_at || null,
      feedbackSubmittedAt: feedback?.created_at || null,
    });

    if (completed && module.day_number < 7) {
      unlockedThrough = Math.max(unlockedThrough, module.day_number + 1);
    }
  }

  const completionPercent = Math.round((completedDays.length / 7) * 100);

  return {
    modules: moduleStates,
    currentDay: Math.min(7, Math.max(1, unlockedThrough)),
    completionPercent,
    completedDays,
    watchedVideos,
    unlockStatus: moduleStates.map((module) => ({
      day_number: module.day_number,
      unlocked: module.unlocked,
      completed: module.completed,
      feedbackSubmitted: module.feedbackSubmitted,
      lockedReason: module.unlocked
        ? null
        : module.day_number === unlockedThrough + 1
          ? "Submit feedback after finishing the previous day."
          : "Locked until earlier days are completed in sequence.",
    })),
  };
}
