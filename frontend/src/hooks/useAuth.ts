import { useEffect, useState } from "react";
import { supabase, type Session, type User } from "@/auth/supabase";
import { refreshTrialStatus } from "@/hooks/useTrialStatus";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

export type UseAuthReturn = AuthState & {
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (
    redirectAfter?: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
};

function siteOrigin(): string {
  // Always use the live host the user is actually on, so auth redirects come
  // back to the same domain (e.g. https://www.bigronjones.com). Preferring a
  // build-time VITE_SITE_URL here is what caused logins on the custom domain
  // to bounce to the Render *.onrender.com origin baked in at build time.
  if (typeof window !== "undefined") return window.location.origin;
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  return fromEnv ? fromEnv.replace(/\/$/, "") : "";
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function linkTrialOnce(token: string | undefined) {
      // Stamps auth_user_id on any trial row that matches this user's email.
      // Critical for the case where someone paid as a guest (or with a
      // different auth provider) — without this, the trial row stays orphaned
      // and the user is treated as not having paid on the new login.
      if (!token) return;
      try {
        await fetch("/api/link-trial", {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        // Without this signal, useTrialStatus races against link-trial: it can
        // call /api/me before the trial row is stamped and end up caching the
        // user as "no trial" — forcing them to sign out/in to see the
        // dashboard + admin links. Dispatching a refresh after link-trial
        // finishes guarantees one fresh /api/me read against the linked state.
        refreshTrialStatus();
      } catch {
        // non-blocking — server upsert in /api/me is the safety net
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setState({ user: session?.user ?? null, session, loading: false });
      if (session?.access_token) {
        linkTrialOnce(session.access_token);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setState({ user: session?.user ?? null, session, loading: false });
      if (event === "SIGNED_IN" && session?.access_token) {
        linkTrialOnce(session.access_token);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp: UseAuthReturn["signUp"] = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${siteOrigin()}/auth/callback`,
      },
    });
    return { error: (error as Error) ?? null };
  };

  const signIn: UseAuthReturn["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: (error as Error) ?? null };
  };

  const signInWithGoogle: UseAuthReturn["signInWithGoogle"] = async (
    redirectAfter,
  ) => {
    const origin = siteOrigin();
    const safeRedirect =
      redirectAfter && redirectAfter.startsWith("/") ? redirectAfter : null;
    const redirectTo = safeRedirect
      ? `${origin}/auth/callback?redirect=${encodeURIComponent(safeRedirect)}`
      : `${origin}/auth/callback`;

    // Debug logging
    console.log("[useAuth] Google OAuth:", {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      siteOrigin: origin,
      redirectTo: redirectTo,
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) {
      console.error("[useAuth] Google OAuth error:", error);
    }

    return { error: (error as Error) ?? null };
  };

  const signOut: UseAuthReturn["signOut"] = async () => {
    // supabase.auth.signOut() defaults to scope: 'global', which makes a
    // round-trip to the auth server to revoke the refresh token. If the
    // network is slow or the token is already invalid that call can hang
    // for many seconds — and the sign-out button feels broken. We do a
    // fast local-only sign-out (wipes session from memory + storage) and
    // fire the global revocation in the background.
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.warn("[useAuth] local signOut failed, clearing manually:", err);
    }
    // Belt-and-braces: nuke any sb-*-auth-token so a stale persistSession
    // can never resurrect the session. We deliberately keep `brj.*` UX caches
    // (e.g. brj.dashboardAccess) so a re-login on the same browser doesn't
    // re-paywall a user whose trial is already active — the server is still
    // the source of truth via /api/me; this is just a fast-path hint.
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("sb-")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // localStorage can be disabled / quota-exceeded — non-fatal
    }
    setState({ user: null, session: null, loading: false });
    // Best-effort server-side revocation; if this hangs we don't block on it.
    supabase.auth.signOut().catch(() => {});
  };

  const resetPassword: UseAuthReturn["resetPassword"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteOrigin()}/auth/callback?type=recovery`,
    });
    return { error: (error as Error) ?? null };
  };

  return {
    ...state,
    isAuthenticated: !!state.user,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };
}
