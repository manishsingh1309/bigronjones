// Admin-route authentication.
//
// Frontend sends `Authorization: Bearer <supabase access token>` on admin
// requests. We verify the token with the Supabase service-role client and
// gate access by the persisted Supabase role on the users row.
//
// The UI guard is just for UX — every protected endpoint MUST call one of
// these helpers so the actual security boundary lives on the server.
import { getAuthenticatedUser } from "../../../backend/lib/auth";

export type AdminUser = {
  id: string;
  email: string;
  role: "admin" | "super_admin";
};

export type AdminCheckResult =
  | { ok: true; user: AdminUser }
  | { ok: false; status: number; error: string };

export async function requireAdmin(req: Request): Promise<AdminCheckResult> {
  try {
    const { authUser, appUser } = await getAuthenticatedUser(req);
    if (appUser.role !== "admin" && appUser.role !== "super_admin") {
      return { ok: false, status: 403, error: "Not an admin" };
    }
    return {
      ok: true,
      user: { id: authUser.id, email: appUser.email, role: appUser.role },
    };
  } catch (err) {
    return {
      ok: false,
      status: 401,
      error:
        err instanceof Response
          ? "Unauthorized"
          : err instanceof Error
            ? err.message
            : "Unauthorized",
    };
  }
}

export async function requireSuperAdmin(req: Request): Promise<AdminCheckResult> {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth;
  if (auth.user.role !== "super_admin") {
    return { ok: false, status: 403, error: "Super admin only" };
  }
  return auth;
}
