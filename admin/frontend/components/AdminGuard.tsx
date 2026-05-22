import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authHeaders } from "@/auth/api";

// UX gate. The actual security boundary is on the server (every admin
// endpoint calls requireAdmin), so users who edit VITE_ADMIN_EMAILS in
// devtools still can't do anything destructive.
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      if (loading) return;
      if (!user) {
        if (mounted) {
          setRole(null);
          setCheckingRole(false);
        }
        return;
      }
      try {
        const headers = await authHeaders();
        const res = await fetch("/api/me", {
          headers,
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!mounted) return;
        setRole(json.user?.role || null);
      } catch {
        if (mounted) setRole(null);
      } finally {
        if (mounted) setCheckingRole(false);
      }
    }

    loadRole();
    return () => {
      mounted = false;
    };
  }, [loading, user]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (role !== "admin" && role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C] mb-3">
            ACCESS DENIED
          </p>
          <h1 className="font-['Bebas_Neue'] text-4xl text-white mb-4">
            ADMIN ONLY
          </h1>
          <p className="font-['DM_Sans'] text-white/50 text-sm">
            This area is for the BigRonJones team. If you think you should have
            access, ask an admin to add your email to the allowlist.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
