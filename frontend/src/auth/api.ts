import { supabase } from "@/auth/supabase";

let staleClearPromise: Promise<unknown> | null = null;

async function clearStaleSession() {
  if (!staleClearPromise) {
    staleClearPromise = supabase.auth.signOut().catch(() => {});
  }
  await staleClearPromise;
  staleClearPromise = null;
}

// supabase.auth.getSession() can stall indefinitely if a stale token is mid-
// refresh. Cap every call at 3s so UI flows (checkout, admin guard, dashboard
// fetch) never hang on auth.
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, ms);
    p.then(
      (v) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(v);
      },
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

// Returns a session only if its access_token is still valid. If the token is
// near expiry we try Supabase's refresh flow BEFORE giving up — otherwise a
// stale 1-hour access token (still backed by a valid refresh token) would
// look "expired" and the user would get unexplained 401s mid-session.
async function getValidSession() {
  const result = await withTimeout(
    supabase.auth.getSession(),
    3000,
    null as Awaited<ReturnType<typeof supabase.auth.getSession>> | null,
  );
  let session = result?.data?.session;

  if (!session?.access_token) return null;

  // expires_at is unix seconds. Treat anything within a 30s skew as expired.
  const exp = session.expires_at ?? 0;
  const nowSec = Math.floor(Date.now() / 1000);
  if (exp && exp - 30 <= nowSec) {
    try {
      const refreshed = await withTimeout(
        supabase.auth.refreshSession(),
        5000,
        null as Awaited<ReturnType<typeof supabase.auth.refreshSession>> | null,
      );
      const next = refreshed?.data?.session;
      if (next?.access_token) {
        session = next;
      } else {
        await clearStaleSession();
        return null;
      }
    } catch {
      await clearStaleSession();
      return null;
    }
  }
  return session;
}

export async function authHeaders(): Promise<HeadersInit> {
  const session = await getValidSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function fetchMe() {
  const session = await getValidSession();
  // No valid session → don't probe the server, just report signed-out.
  if (!session?.access_token) return null;

  const res = await fetch("/api/me", {
    headers: { Authorization: `Bearer ${session.access_token}` },
    credentials: "include",
  });

  if (res.status === 401) {
    // Server rejected a token we believed was valid (revoked, project mismatch).
    // Clear it so the UI reflects a clean signed-out state.
    await clearStaleSession();
    return null;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load user");
  }

  return res.json();
}
