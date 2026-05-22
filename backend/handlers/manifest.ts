// Static manifest of API handlers. Imported by the single Vercel function
// at /api/[...path].ts which dispatches to the right handler by URL path.
//
// Adding a new handler? Add it here AND under its key. Keys are the URL
// path after `/api/` (no leading slash, no `.ts`).

import adminCoachNotes from "../../admin/backend/handlers/coach-notes";
import adminContent from "../../admin/backend/handlers/content";
import adminLeads from "../../admin/backend/handlers/leads";
import adminStats from "../../admin/backend/handlers/stats";
import adminSuperDashboard from "../../admin/backend/handlers/super-dashboard";
import adminTrialFeedback from "../../admin/backend/handlers/trial-feedback";
import adminTrialReply from "../../admin/backend/handlers/trial-reply";
import adminTrialStats from "../../admin/backend/handlers/trial-stats";
import adminTrialUsers from "../../admin/backend/handlers/trial-users";
import adminUploadUrl from "../../admin/backend/handlers/upload-url";
import apply from "./apply";
import blogs from "./blogs";
import bookingCompletion from "./booking-completion";
import captureLead from "./capture-lead";
import checkout from "./checkout";
import contact from "./contact";
import cronEmailScheduler from "./cron/email-scheduler";
import dashboard from "./dashboard";
import dashboardAnalytics from "./dashboard/analytics";
import dashboardCheckIns from "./dashboard/check-ins";
import dashboardDailyFeedback from "./dashboard/daily-feedback";
import dashboardEmailProgress from "./dashboard/email-progress";
import dashboardSummary from "./dashboard/summary";
import dashboardVideoProgress from "./dashboard/video-progress";
import dashboardWorkouts from "./dashboard/workouts";
import dayComplete from "./day-complete";
import generateBlogs from "./generate-blogs";
import leadMagnet from "./lead-magnet";
import linkTrial from "./link-trial";
import logActivity from "./log-activity";
import login from "./login";
import me from "./me";
import metrics from "./metrics";
import newsletter from "./newsletter";
import sendSequence from "./send-sequence";
import testWebhookCalendly from "./test-webhook-calendly";
import testStartTrial from "./test/start-trial";
import trialFeedback from "./trial-feedback";
import unsubscribe from "./unsubscribe";
import verifyTrialPayment from "./verify-trial-payment";
import webhooksCalendly from "./webhooks-calendly";
import webhooksStripe from "./webhooks/stripe";

export type ApiHandler = (req: Request) => Promise<Response> | Response;

export const handlerMap: Record<string, ApiHandler> = {
  "admin/coach-notes": adminCoachNotes,
  "admin/content": adminContent,
  "admin/leads": adminLeads,
  "admin/stats": adminStats,
  "admin/super-dashboard": adminSuperDashboard,
  "admin/trial-feedback": adminTrialFeedback,
  "admin/trial-reply": adminTrialReply,
  "admin/trial-stats": adminTrialStats,
  "admin/trial-users": adminTrialUsers,
  "admin/upload-url": adminUploadUrl,
  apply,
  blogs,
  "booking-completion": bookingCompletion,
  "capture-lead": captureLead,
  checkout,
  contact,
  "cron/email-scheduler": cronEmailScheduler,
  dashboard,
  "dashboard/analytics": dashboardAnalytics,
  "dashboard/check-ins": dashboardCheckIns,
  "dashboard/daily-feedback": dashboardDailyFeedback,
  "dashboard/email-progress": dashboardEmailProgress,
  "dashboard/summary": dashboardSummary,
  "dashboard/video-progress": dashboardVideoProgress,
  "dashboard/workouts": dashboardWorkouts,
  "day-complete": dayComplete,
  "generate-blogs": generateBlogs,
  "lead-magnet": leadMagnet,
  "link-trial": linkTrial,
  "log-activity": logActivity,
  login,
  me,
  metrics,
  newsletter,
  "send-sequence": sendSequence,
  "test-webhook-calendly": testWebhookCalendly,
  "test/start-trial": testStartTrial,
  "trial-feedback": trialFeedback,
  unsubscribe,
  "verify-trial-payment": verifyTrialPayment,
  "webhooks-calendly": webhooksCalendly,
  "webhooks/calendly": webhooksCalendly,
  "webhooks/stripe": webhooksStripe,
};
