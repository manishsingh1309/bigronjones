import { createServerSupabase } from "../../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../../lib/auth";
import { getDashboardAccess } from "../../lib/dashboardAccess";
import { premiumDashboardMock } from "../../lib/premium-dashboard";


export default async function handler(req: Request): Promise<Response> {
  try {
    const { appUser } = await getAuthenticatedUser(req);
    const access = getDashboardAccess(appUser);
    if (!access.allowed) {
      return Response.json(
        { error: access.reason || "Dashboard locked" },
        { status: 403 },
      );
    }

    const supabase = createServerSupabase();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("email_progress")
        .select("*")
        .eq("user_id", appUser.id)
        .order("step", { ascending: true });

      if (error) {
        return Response.json({
          emailProgress: premiumDashboardMock.emailProgress,
        });
      }

      return Response.json({
        emailProgress: data || premiumDashboardMock.emailProgress,
      });
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = (await req.json()) as { step?: number; status?: string };
    const step = Math.max(1, Math.min(5, Number(body.step || 1)));
    const status =
      body.status === "opened" || body.status === "read" ? body.status : "sent";

    const { data, error } = await supabase
      .from("email_progress")
      .upsert(
        {
          user_id: appUser.id,
          step,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,step" },
      )
      .select()
      .single();

    if (error) {
      console.warn(
        "[dashboard/email-progress] upsert failed, returning mock success:",
        error.message,
      );
      return Response.json({
        success: true,
        saved: false,
        emailProgress: premiumDashboardMock.emailProgress,
      });
    }

    return Response.json({ success: true, saved: true, emailProgress: data });
  } catch (error) {
    return jsonError(error);
  }
}
