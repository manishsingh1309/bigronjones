// One-off: create the admin@gmail.com account in Supabase with a known
// password and the email pre-confirmed. Uses the service-role key, which
// is the only way to bypass the confirmation email step.
//
// Run: npx tsx scripts/create-admin-user.ts
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

const EMAIL = "admin@gmail.com";
const PASSWORD = "admin@123";

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

  // Look up existing auth users — listUsers is paginated; one page is enough
  // for a tiny project.
  const { data: existing, error: listErr } = await supabase.auth.admin.listUsers(
    { page: 1, perPage: 200 }
  );
  if (listErr) {
    console.error("listUsers failed:", listErr.message);
    process.exit(1);
  }
  const found = existing.users.find(
    (u) => u.email?.toLowerCase() === EMAIL.toLowerCase()
  );

  if (found) {
    // Already there — just (re)set the password and confirm the email.
    const { error: updErr } = await supabase.auth.admin.updateUserById(found.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (updErr) {
      console.error("updateUserById failed:", updErr.message);
      process.exit(1);
    }
    console.log(`Updated existing user ${EMAIL} (id=${found.id})`);
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "BigRonJones Admin" },
    });
    if (createErr) {
      console.error("createUser failed:", createErr.message);
      process.exit(1);
    }
    console.log(`Created auth user ${EMAIL} (id=${created.user?.id})`);
  }

  // Mirror into public.users with role=super_admin so this account can see
  // every section of the dashboard (analytics, coach notes, content, leads,
  // trial users) without bumping into "Super admin only" gates.
  const { error: upsertErr } = await supabase
    .from("users")
    .upsert(
      {
        email: EMAIL,
        name: "BigRonJones Admin",
        role: "super_admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
  if (upsertErr) {
    // role column may not exist on older databases — log but don't fail
    console.warn(
      "public.users upsert warning (non-fatal):",
      upsertErr.message
    );
  } else {
    console.log("Mirrored to public.users with role=admin");
  }

  console.log("\nDone. Sign in at http://localhost:3000/auth/login");
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
