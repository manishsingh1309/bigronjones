import { useCallback, useEffect, useRef, useState } from "react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";

export type TrialStatus = {
  role: "user" | "admin" | "super_admin" | null;
  paymentStatus: string | null;
  programType: string | null;
  hasBookedCalendly: boolean;
  bookingCompleted: boolean;
  bookingTime: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialCompletedAt: string | null;
  priorityWindowExpiresAt: string | null;
  // Derived
  hasTrial: boolean;
  trialDay: number | null; // 1..7 or null when not started
  trialIsActive: boolean;
  trialIsComplete: boolean;
  isAdmin: boolean; // role is admin OR super_admin
};

const EMPTY: TrialStatus = {
  role: null,
  paymentStatus: null,
  programType: null,
  hasBookedCalendly: false,
  bookingCompleted: false,
  bookingTime: null,
  trialStartDate: null,
  trialEndDate: null,
  trialCompletedAt: null,
  priorityWindowExpiresAt: null,
  hasTrial: false,
  trialDay: null,
  trialIsActive: false,
  trialIsComplete: false,
  isAdmin: false,
};

// Window event that any page can dispatch to force every mounted
// useTrialStatus instance (navbar, dashboard chrome, …) to refetch /api/me.
// Use after a Stripe redirect, a successful booking, or an admin role grant —
// anywhere the user's server-side state has changed and we don't want them
// to have to log out/in to see it.
const REFRESH_EVENT = "brj:user-refresh";

export function refreshTrialStatus() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REFRESH_EVENT));
}

function deriveDay(start: string | null) {
  if (!start) return null;
  const t = new Date(start).getTime();
  if (Number.isNaN(t)) return null;
  const elapsed = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(7, elapsed + 1));
}

/**
 * Lightweight trial-state fetcher used by chrome (navbar). Returns EMPTY when
 * the user is signed out or the request fails — so it never throws into the
 * navbar render path. Refetches automatically on:
 *   - mount
 *   - Supabase auth state change (login/logout/token refresh)
 *   - window focus / visibilitychange (covers tab-return from Stripe/Calendly)
 *   - the `brj:user-refresh` custom event (call `refreshTrialStatus()`)
 */
export function useTrialStatus(): TrialStatus & {
  loading: boolean;
  refresh: () => void;
} {
  const [state, setState] = useState<TrialStatus>(EMPTY);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  // Debounce rapid back-to-back refreshes (focus + visibility + event can all
  // fire in the same tick when the user tabs back in from Stripe).
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        if (mountedRef.current) {
          setState(EMPTY);
          setLoading(false);
        }
        return;
      }
      const res = await fetch("/api/me", {
        headers: await authHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        if (mountedRef.current) {
          setState(EMPTY);
          setLoading(false);
        }
        return;
      }
      const json = await res.json();
      const u = json.user || {};
      const trialStartDate: string | null = u.trialStartDate ?? null;
      const trialCompletedAt: string | null = u.trialCompletedAt ?? null;
      const role: TrialStatus["role"] = u.role ?? null;
      const next: TrialStatus = {
        role,
        paymentStatus: u.paymentStatus ?? null,
        programType: u.programType ?? null,
        hasBookedCalendly: !!u.hasBookedCalendly,
        bookingCompleted: !!u.bookingCompleted,
        bookingTime: u.bookingTime ?? trialStartDate,
        trialStartDate,
        trialEndDate: u.trialEndDate ?? null,
        trialCompletedAt,
        priorityWindowExpiresAt: u.priorityWindowExpiresAt ?? null,
        hasTrial: u.paymentStatus === "paid" || !!trialStartDate,
        trialDay: deriveDay(trialStartDate),
        trialIsActive: !!trialStartDate && !trialCompletedAt,
        trialIsComplete: !!trialCompletedAt,
        isAdmin: role === "admin" || role === "super_admin",
      };
      if (mountedRef.current) {
        setState(next);
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) {
        setLoading(false);
      }
    } finally {
      inFlightRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        load();
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };
    const onRefresh = () => load();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(REFRESH_EVENT, onRefresh);

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(REFRESH_EVENT, onRefresh);
    };
  }, [load]);

  return { ...state, loading, refresh: load };
}
