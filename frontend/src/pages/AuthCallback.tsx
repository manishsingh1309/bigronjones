import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/auth/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    function finish(target: string) {
      if (cancelled) return;
      navigate(target, { replace: true });
    }

    const redirectParam = params.get("redirect");
    const successTarget =
      params.get("type") === "recovery"
        ? "/auth/reset-password"
        : redirectParam && redirectParam.startsWith("/")
          ? redirectParam
          : "/";

    // detectSessionInUrl is on, so the client auto-exchanges the auth code.
    // We just wait for the resulting session, then route accordingly.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish(successTarget);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finish(successTarget);
    });

    const timeout = window.setTimeout(() => {
      if (!cancelled) navigate("/auth/login?error=auth_failed", { replace: true });
    }, 8000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate, params]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <p className="font-['DM_Mono'] text-[11px] tracking-[0.3em] text-white/40 uppercase">
          Authenticating...
        </p>
      </div>
    </div>
  );
}
