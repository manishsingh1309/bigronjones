// Browser-safe Supabase client.
// Uses VITE_-prefixed env vars only — never imports the server service-role key.
// Imported as `@/auth/supabase` (resolves via the catch-all @/* alias to src/*).
import { createClient, type Session, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase browser client missing config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export type { Session, User };
