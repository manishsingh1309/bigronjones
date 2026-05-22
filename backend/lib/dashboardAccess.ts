import type { AppUser } from "./auth";

export type DashboardAccess = {
  paymentStatus: string | null;
  bookingCompleted: boolean;
  bookingTime: string | null;
  allowed: boolean;
  reason?: string;
  trialActive?: boolean;
};

// A trial_start_date can only be written by booking-completion.ts or the
// Calendly webhook, both of which verify Stripe payment first. So presence of
// trial_start_date is a stronger signal of "this user paid" than the
// payment_status string itself — the latter can be stuck at "pending" if the
// browser-side verify-trial-payment call never completed (slow network, user
// closed the tab, logged out mid-flow). Treat trial_start_date as authoritative
// so re-login never re-prompts an already-active trial.
export function getDashboardAccess(appUser: AppUser): DashboardAccess {
  const paymentStatus = appUser.payment_status || null;
  const hasTrialStart = !!appUser.trial_start_date;
  const hasBooking = !!appUser.has_booked_calendly && hasTrialStart;
  const effectivePaid = paymentStatus === "paid" || hasTrialStart;

  if (!effectivePaid) {
    return {
      paymentStatus,
      bookingCompleted: false,
      bookingTime: null,
      allowed: false,
      trialActive: false,
      reason: "Payment has not been confirmed yet.",
    };
  }

  if (!hasBooking) {
    return {
      paymentStatus,
      bookingCompleted: false,
      bookingTime: appUser.trial_start_date || null,
      allowed: false,
      trialActive: false,
      reason: "Calendly booking is required before dashboard access.",
    };
  }

  return {
    paymentStatus,
    bookingCompleted: true,
    bookingTime: appUser.trial_start_date || null,
    allowed: true,
    trialActive: true,
  };
}
