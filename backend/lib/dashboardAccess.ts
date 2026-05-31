import type { AppUser } from "./auth";

export type DashboardAccess = {
  paymentStatus: string | null;
  bookingCompleted: boolean;
  bookingTime: string | null;
  allowed: boolean;
  reason?: string;
  trialActive?: boolean;
};

// Access model: PAYMENT unlocks the 7-day trial dashboard. The moment a user's
// Stripe payment is confirmed (webhook, browser verify, or booking) we set
// payment_status="paid" and trial_start_date, and the dashboard opens. The 1:1
// Calendly call is an optional onboarding step — NOT a gate.
//
// trial_start_date is treated as authoritative: it's only ever written after a
// verified Stripe payment, and payment_status can lag at "pending" if the
// browser-side verify never completed (slow network, closed tab, mid-flow
// logout). Keying access off "paid OR trial_start_date" means a re-login never
// re-prompts an already-paid user to buy again.
//
// bookingCompleted is reported for UX/admin only — it no longer gates access.
export function getDashboardAccess(appUser: AppUser): DashboardAccess {
  const paymentStatus = appUser.payment_status || null;
  const hasTrialStart = !!appUser.trial_start_date;
  const bookingCompleted = !!appUser.has_booked_calendly && hasTrialStart;
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

  // Paid → trial dashboard is open. Booking is no longer required.
  return {
    paymentStatus,
    bookingCompleted,
    bookingTime: appUser.trial_start_date || null,
    allowed: true,
    trialActive: !appUser.trial_completed_at,
  };
}
