import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authHeaders } from "@/auth/api";
import { useAuth } from "@/hooks/useAuth";

type DashboardAccess = {
  allowed?: boolean;
  paymentStatus?: string | null;
  bookingCompleted?: boolean;
  bookingTime?: string | null;
  trialActive?: boolean;
  reason?: string;
};

type MeUser = {
  paymentStatus?: string | null;
  bookingCompleted?: boolean;
  trialStartDate?: string | null;
  trialEndDate?: string | null;
};

function readTemporaryAccess() {
  try {
    const raw = localStorage.getItem("brj.dashboardAccess");
    return raw
      ? (JSON.parse(raw) as DashboardAccess & { bookingCompleted?: boolean })
      : null;
  } catch {
    return null;
  }
}

type Decision = {
  allowed: boolean;
  redirectTo: string | null;
  reason: string;
};

function decide(
  access: DashboardAccess,
  user: MeUser | undefined,
  temp: ReturnType<typeof readTemporaryAccess>,
): Decision {
  const hasTrialStart = !!user?.trialStartDate;
  // Payment unlocks the dashboard — the Calendly call is no longer a gate.
  const isPaid =
    user?.paymentStatus === "paid" ||
    access.paymentStatus === "paid" ||
    hasTrialStart;
  const tempAllowed = temp?.paymentStatus === "paid";

  if (access.allowed === true || isPaid || tempAllowed) {
    return { allowed: true, redirectTo: null, reason: "" };
  }

  // Not paid → trial purchase page (not "/", which is too vague).
  return {
    allowed: false,
    redirectTo: "/programs/trial",
    reason: access.reason || "Start your 7-day trial to unlock the dashboard.",
  };
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      if (authLoading) return;

      const headers = await authHeaders();
      if (!headers || !(headers as Record<string, string>).Authorization) {
        if (mounted) {
          setNeedsLogin(true);
          setChecking(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/me", {
          headers,
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        const access: DashboardAccess = json.dashboardAccess || {};
        const temp = readTemporaryAccess();

        if (mounted) {
          setDecision(decide(access, json.user, temp));
          setChecking(false);
        }
      } catch (err) {
        console.error("[ProtectedRoute] access check failed:", err);
        if (mounted) {
          const temp = readTemporaryAccess();
          const tempAllowed = temp?.paymentStatus === "paid";
          setDecision(
            tempAllowed
              ? { allowed: true, redirectTo: null, reason: "" }
              : {
                  allowed: false,
                  redirectTo: "/programs/trial",
                  reason: "Unable to validate dashboard access.",
                },
          );
          setChecking(false);
        }
      }
    }

    checkAccess();
    return () => {
      mounted = false;
    };
  }, [authLoading]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#E8192C]" />
          <p className="mt-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/45">
            Verifying access…
          </p>
        </div>
      </div>
    );
  }

  if (needsLogin) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (decision && !decision.allowed && decision.redirectTo) {
    console.warn(
      "[ProtectedRoute] redirecting:",
      decision.redirectTo,
      decision.reason,
    );
    return <Navigate to={decision.redirectTo} replace />;
  }

  return <>{children}</>;
}
