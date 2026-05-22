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

    if (req.method === "POST") {
      const body = (await req.json()) as {
        workoutId?: string;
        completed?: boolean;
      };
      const workoutId = (body.workoutId || "").toString().trim();
      if (!workoutId) {
        return Response.json(
          { error: "workoutId is required" },
          { status: 400 },
        );
      }

      const { data, error } = await supabase
        .from("workouts")
        .upsert(
          {
            id: workoutId,
            user_id: appUser.id,
            completed: body.completed !== false,
            completed_at:
              body.completed === false ? null : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select()
        .single();

      if (error) {
        return Response.json({
          success: true,
          saved: false,
          workoutId,
          completed: body.completed !== false,
        });
      }

      return Response.json({ success: true, saved: true, workout: data });
    }

    if (req.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", appUser.id)
      .order("day", { ascending: true });

    if (error) {
      return Response.json({ workouts: premiumDashboardMock.workouts });
    }

    return Response.json({ workouts: data || premiumDashboardMock.workouts });
  } catch (error) {
    return jsonError(error);
  }
}
