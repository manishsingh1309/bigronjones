import { createServerSupabase } from "../../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../../lib/auth";
import { getDashboardAccess } from "../../lib/dashboardAccess";
import { premiumDashboardMock } from "../../lib/premium-dashboard";


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

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
    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("mood, energy, performance, weight, created_at")
      .eq("user_id", appUser.id)
      .order("created_at", { ascending: true });

    if (!checkIns?.length) {
      return Response.json({ analytics: premiumDashboardMock.analytics });
    }

    const labels = checkIns.map((_, index) => `Day ${index + 1}`);
    const analytics = {
      labels,
      energy: checkIns.map((row) => Number(row.energy || 0)),
      mood: checkIns.map((row) => Number(row.mood || 0)),
      performance: checkIns.map((row) => Number(row.performance || 0)),
      checkInConsistency: checkIns.map((_, index) => index + 1),
      weight: checkIns.map((row) =>
        typeof row.weight === "number" ? row.weight : null,
      ),
    };

    return Response.json({ analytics });
  } catch (error) {
    return jsonError(error);
  }
}
