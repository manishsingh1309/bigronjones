import { createServerSupabase } from "../../lib/supabase";
import { getAuthenticatedUser, jsonError } from "../../lib/auth";
import { getDashboardAccess } from "../../lib/dashboardAccess";
import type { CheckInInput } from "../../lib/premium-dashboard";


function clamp(value: unknown, min = 1, max = 10) {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

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
        .from("check_ins")
        .select("*")
        .eq("user_id", appUser.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        return Response.json({ checkIns: [] });
      }

      return Response.json({ checkIns: data || [] });
    }

    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const body = (await req.json()) as CheckInInput;
    const trialDay = Math.max(1, Math.min(7, Number(body.trialDay || 1)));
    const payload = {
      user_id: appUser.id,
      trial_day: trialDay,
      mood: clamp(body.mood),
      energy: clamp(body.energy),
      sleep_quality: clamp(body.sleepQuality),
      soreness: clamp(body.soreness),
      performance: clamp(body.performance),
      weight: body.weight ?? null,
      waist: body.waist ?? null,
      hr: body.hr ?? null,
      hrv: body.hrv ?? null,
      notes: body.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("check_ins")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.warn(
        "[dashboard/check-ins] insert failed, returning mock success:",
        error.message,
      );
      return Response.json({ success: true, saved: false, checkIn: payload });
    }

    return Response.json({ success: true, saved: true, checkIn: data });
  } catch (error) {
    return jsonError(error);
  }
}
