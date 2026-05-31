import { getAuthenticatedUser, jsonError } from "../lib/auth";
import { getDashboardAccess } from "../lib/dashboardAccess";
import { createServerSupabase } from "../lib/supabase";


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    console.log("[/api/me] req.session", {
      hasAuthorizationHeader: Boolean(req.headers.get("authorization")),
      hasCookieHeader: Boolean(req.headers.get("cookie")),
    });
    const { authUser, appUser } = await getAuthenticatedUser(req);

    // Self-heal so payment and trial-start stay in lock-step (payment unlocks
    // the trial dashboard). Two directions:
    //   1. Has a trial_start_date but status stuck at "pending" — the
    //      browser-side verify never landed; promote to "paid".
    //   2. Is "paid" but has no trial_start_date — e.g. paid before this
    //      access model, or a path marked paid without starting the trial;
    //      start the 7-day clock now so the dashboard opens.
    const isPaid = appUser.payment_status === "paid" || !!appUser.trial_start_date;
    const needsPromote = !!appUser.trial_start_date && appUser.payment_status !== "paid";
    const needsTrialStart = isPaid && !appUser.trial_start_date;

    if (needsPromote || needsTrialStart) {
      const db = createServerSupabase();
      const now = new Date();
      const heal: Record<string, unknown> = {
        payment_status: "paid",
        updated_at: now.toISOString(),
      };
      if (needsTrialStart) {
        heal.trial_start_date = now.toISOString();
        heal.trial_end_date = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString();
      }
      const { error: healError } = await db
        .from("users")
        .update(heal)
        .eq("id", appUser.id);
      if (healError) {
        console.warn("[/api/me] self-heal failed:", healError.message);
      } else {
        appUser.payment_status = "paid";
        if (needsTrialStart) {
          appUser.trial_start_date = heal.trial_start_date as string;
          appUser.trial_end_date = heal.trial_end_date as string;
        }
      }
    }

    const access = getDashboardAccess(appUser);
    console.log("[/api/me] req.user", {
      id: appUser.id,
      email: appUser.email,
      authId: authUser.id,
    });
    return Response.json({
      user: {
        id: appUser.id,
        authId: authUser.id,
        email: appUser.email,
        name: appUser.name,
        role: appUser.role || "user",
        paymentStatus: appUser.payment_status || null,
        programType: appUser.program_type || null,
        hasBookedCalendly: !!appUser.has_booked_calendly,
        bookingCompleted: access.bookingCompleted,
        bookingTime: access.bookingTime,
        trialStartDate: appUser.trial_start_date,
        trialEndDate: appUser.trial_end_date,
        trialCompletedAt: appUser.trial_completed_at,
        priorityWindowExpiresAt: appUser.priority_window_expires_at,
        convertedToPaid: !!appUser.converted_to_paid,
      },
      dashboardAccess: access,
    });
  } catch (error) {
    return jsonError(error);
  }
}
