import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "./supabase";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role?: "user" | "admin" | "super_admin";
  payment_status?: string | null;
  program_type?: string | null;
  has_booked_calendly?: boolean;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  trial_completed_at?: string | null;
  priority_window_expires_at?: string | null;
  converted_to_paid?: boolean;
};

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function displayName(user: User): string {
  const metadata = user.user_metadata || {};
  return (
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "BigRonJones Member"
  );
}

function getAllowlistedRole(email: string): "user" | "admin" | "super_admin" {
  const normalized = email.toLowerCase();
  const superAdmins = (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (superAdmins.includes(normalized)) return "super_admin";

  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(normalized)) return "admin";

  return "user";
}

export async function getAuthenticatedUser(req: Request): Promise<{
  authUser: User;
  appUser: AppUser;
}> {
  const token = bearerToken(req);
  if (!token) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = createServerSupabase();
  const { data, error } = await db.auth.getUser(token);

  if (error || !data.user?.email) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authUser = data.user;
  const email = authUser.email!.toLowerCase();
  const name = displayName(authUser);
  const inferredRole = getAllowlistedRole(email);

  // Try to read the persisted role. If the column doesn't exist on this
  // Supabase project yet (PGRST204 — schema migration hasn't run), we silently
  // fall back to the email-allowlist inferred role and skip writing it back.
  let existingRole: AppUser["role"] | null = null;
  let roleColumnAvailable = true;
  {
    const { data: existingUser, error: readErr } = await db
      .from("users")
      .select("role")
      .eq("email", email)
      .maybeSingle();
    if (readErr) {
      const msg = (readErr.message || "").toLowerCase();
      if (msg.includes("'role'") || readErr.code === "PGRST204") {
        roleColumnAvailable = false;
      } else {
        console.warn("[auth] role read failed:", readErr.message);
      }
    } else {
      existingRole = (existingUser?.role as AppUser["role"] | null) ?? null;
    }
  }
  const role =
    existingRole && existingRole !== "user" ? existingRole : inferredRole;

  // Build the upsert payload — only include `role` if the column exists.
  // This keeps the code working on projects that haven't yet run the migration
  // that added `users.role`.
  const upsertPayload: Record<string, unknown> = {
    email,
    name,
    auth_user_id: authUser.id,
    updated_at: new Date().toISOString(),
  };
  if (roleColumnAvailable) upsertPayload.role = role;

  // Stamping auth_user_id on every upsert makes guest-checkout → sign-up flow
  // self-healing: the row created by /api/checkout (matched only by email)
  // gets the Supabase auth ID the first time the user makes any authenticated
  // request. No explicit linking step required.
  const baseColumns =
    "id, email, name, payment_status, program_type, has_booked_calendly, trial_start_date, trial_end_date, trial_completed_at, priority_window_expires_at, converted_to_paid";
  const selectColumns = roleColumnAvailable
    ? `${baseColumns}, role`
    : baseColumns;

  // The .select() string is built dynamically so we have to cast the result
  // — postgrest-js's compile-time parser only understands literal strings and
  // sees the template-string concatenation as a parse error otherwise.
  type UpsertResult = { data: AppUser | null; error: { code?: string; message?: string } | null };
  let upsertResult = (await db
    .from("users")
    .upsert(upsertPayload, { onConflict: "email" })
    .select(selectColumns)
    .single()) as unknown as UpsertResult;
  let appUser = upsertResult.data;
  let upsertError = upsertResult.error;

  // Schema cache lag: if the role column was reported missing after we read
  // it, retry once without it.
  if (
    upsertError &&
    roleColumnAvailable &&
    (upsertError.code === "PGRST204" ||
      (upsertError.message || "").toLowerCase().includes("'role'"))
  ) {
    delete upsertPayload.role;
    upsertResult = (await db
      .from("users")
      .upsert(upsertPayload, { onConflict: "email" })
      .select(baseColumns)
      .single()) as unknown as UpsertResult;
    appUser = upsertResult.data;
    upsertError = upsertResult.error;
  }

  if (upsertError || !appUser) {
    console.error("[auth] Failed to upsert app user:", upsertError);
    throw new Response(JSON.stringify({ error: "Failed to load user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Always return a populated role to callers — using the runtime-inferred
  // value when the DB doesn't have a column to store it.
  const merged: AppUser = {
    ...appUser,
    role: appUser.role || role,
  };
  return { authUser, appUser: merged };
}

export function jsonError(error: unknown, fallback = "Internal server error") {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : fallback;
  return Response.json({ error: message }, { status: 500 });
}
