import { createServerSupabase } from "../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../lib/auth";


const ALLOWED_TYPES = new Set([
  "login",
  "video_started",
  "video_completed",
  "day_completed",
  "feedback_submitted",
  "playlist_opened",
  "metrics_submitted",
  "call_booked",
  "phase2_viewed",
  "admin_replied",
]);

/**
 * POST /api/log-activity
 *
 * Lightweight, fire-and-forget activity log. Drives Ron's live feed in the
 * super-admin dashboard. The handler is intentionally permissive (returns 200
 * even on bad input) because we never want a tracking call to bubble an error
 * back into the user's UI.
 */
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { appUser } = await getAuthenticatedUser(req);
    let body: { activity_type?: string; metadata?: Record<string, unknown> };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return Response.json({ ok: false, reason: "bad_json" }, { status: 200 });
    }

    const type = (body.activity_type || "").toString();
    if (!ALLOWED_TYPES.has(type)) {
      return Response.json({ ok: false, reason: "unknown_type" }, { status: 200 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from("user_activity_log").insert({
      user_id: appUser.id,
      activity_type: type,
      metadata: body.metadata || {},
    });
    if (error) {
      console.error("[log-activity] insert failed:", error.message);
      return Response.json({ ok: false }, { status: 200 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
