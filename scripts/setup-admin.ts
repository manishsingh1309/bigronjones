// One-off: bring the admin slot in line with .env.
//
// Whatever email is listed in SUPER_ADMIN_EMAILS becomes THE admin:
//   • All other admin accounts (in auth.users AND public.users) are removed.
//   • A public.users row is pre-created with role=super_admin so the very
//     first Google OAuth sign-in lands on a fully unlocked /admin dashboard.
//
// The actual Supabase auth.users row gets created automatically by the Google
// OAuth flow — no password is needed and we don't pre-create it here.
//
// Run: npx tsx scripts/setup-admin.ts
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Minimal .env loader — same approach as backend/dev-server.ts
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const sep = t.indexOf("=");
    if (sep === -1) continue;
    const k = t.slice(0, sep).trim();
    const v = t
      .slice(sep + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (k && process.env[k] === undefined) process.env[k] = v;
  }
}

function emailList(name: string): string[] {
  return (process.env[name] || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const adminEmails = new Set([
    ...emailList("ADMIN_EMAILS"),
    ...emailList("SUPER_ADMIN_EMAILS"),
  ]);
  const superAdmins = new Set(emailList("SUPER_ADMIN_EMAILS"));

  if (adminEmails.size === 0) {
    console.error("No admin emails configured. Set ADMIN_EMAILS in .env.");
    process.exit(1);
  }

  console.log("Allowed admin emails:", Array.from(adminEmails).join(", "));
  console.log("Super admins:", Array.from(superAdmins).join(", "));

  // ── 1. Find and delete every Supabase auth.users that has the OLD admin
  // role flagged in public.users but isn't on the current allowlist.
  const { data: existingAdmins, error: listAdminsErr } = await supabase
    .from("users")
    .select("email")
    .in("role", ["admin", "super_admin"]);
  if (listAdminsErr) {
    console.warn("Could not list existing admins:", listAdminsErr.message);
  }
  const staleAdmins = (existingAdmins || [])
    .map((r) => (r.email as string | undefined)?.toLowerCase())
    .filter((email): email is string => Boolean(email))
    .filter((email) => !adminEmails.has(email));

  if (staleAdmins.length > 0) {
    console.log(`Demoting ${staleAdmins.length} stale admin(s):`, staleAdmins);
    // Demote in public.users so AdminGuard rejects them immediately.
    const { error: demoteErr } = await supabase
      .from("users")
      .update({ role: "user", updated_at: new Date().toISOString() })
      .in("email", staleAdmins);
    if (demoteErr) {
      console.warn("Demotion failed:", demoteErr.message);
    }

    // Also remove their auth.users records so they can no longer sign in.
    const { data: pageOfAuth } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    for (const u of pageOfAuth.users) {
      const email = u.email?.toLowerCase();
      if (email && staleAdmins.includes(email)) {
        const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
        if (delErr) {
          console.warn(`Could not delete auth user ${email}:`, delErr.message);
        } else {
          console.log(`Deleted auth.users row for ${email}`);
        }
      }
    }
  }

  // ── 2. Pre-mirror every allowed admin into public.users with role set.
  for (const email of adminEmails) {
    const role = superAdmins.has(email) ? "super_admin" : "admin";
    const { error: upsertErr } = await supabase.from("users").upsert(
      {
        email,
        name: "BigRonJones Admin",
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    if (upsertErr) {
      console.warn(`Upsert failed for ${email}:`, upsertErr.message);
    } else {
      console.log(`public.users seeded: ${email} → role=${role}`);
    }
  }

  console.log("\nDone.");
  console.log("Sign in at http://localhost:3000/auth/login");
  console.log("Click 'Continue with Google' and pick:", Array.from(superAdmins)[0]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
