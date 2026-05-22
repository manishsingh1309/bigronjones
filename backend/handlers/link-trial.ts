import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../lib/auth";


/**
 * POST /api/link-trial
 *
 * Connects the current Supabase auth user to the trial-system `users` row
 * that was created during Stripe checkout. Required because guest checkout
 * creates the trial record by email — once the user signs in we need to
 * stamp their auth_user_id so the dashboard can find their trial.
 *
 * The fact that getAuthenticatedUser already upserts a `users` row by email
 * means this endpoint is mostly idempotent: it just ensures auth_user_id is
 * set. Safe to call after every sign-in (fire-and-forget from the client).
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { authUser, appUser } = await getAuthenticatedUser(req);
    const supabase = createServerSupabase();

    const { error } = await supabase
      .from("users")
      .update({
        auth_user_id: authUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appUser.id);

    if (error) {
      console.error("[link-trial] update failed:", error);
      return Response.json(
        { error: "Failed to link auth account" },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      userId: appUser.id,
      authUserId: authUser.id,
      email: appUser.email,
    });
  } catch (error) {
    return jsonError(error);
  }
}
