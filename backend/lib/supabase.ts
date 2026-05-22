// Server-only Supabase client.
// Uses the service-role key — bypasses Row Level Security.
// NEVER import this file from frontend/ — it would leak the service key into the browser bundle.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function createServerSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase server client missing config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
