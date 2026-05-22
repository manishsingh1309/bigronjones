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

    // Self-heal: if the user has a trial_start_date (only written after a
    // verified Stripe payment) but payment_status is still "pending", the
    // browser-side verify-trial-payment never landed. Promote them to "paid"
    // here so future requests don't keep tripping the paywall.
    if (
      appUser.trial_start_date &&
      appUser.payment_status !== "paid"
    ) {
      const db = createServerSupabase();
      const { error: healError } = await db
        .from("users")
        .update({
          payment_status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appUser.id);
      if (healError) {
        console.warn(
          "[/api/me] self-heal payment_status failed:",
          healError.message,
        );
      } else {
        appUser.payment_status = "paid";
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
