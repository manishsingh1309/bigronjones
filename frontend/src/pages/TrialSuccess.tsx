import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";
import { refreshTrialStatus } from "@/hooks/useTrialStatus";

// Optional 1:1 onboarding call — no longer required to access the dashboard.
const CALENDLY_URL = "https://calendly.com/bigronjonesllc/discovery-call";

export default function TrialSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Payment Confirmed — Your Trial Is Active | BigRonJones®";
  }, []);

  // 1) Verify the Stripe session against Stripe's API. This flips the user's
  //    payment_status to "paid" AND starts the 7-day trial (trial_start_date)
  //    server-side — the redirect-based equivalent of the Stripe webhook.
  //    Without it the dashboard could still think the user hadn't paid.
  // 2) If signed in, stamp auth_user_id on the trial row (link-trial) and
  //    send them straight to the dashboard — payment is all that's required.
  useEffect(() => {
    let mounted = true;
    (async () => {
      // Verify payment first — works whether or not the user is signed in.
      // Retry a few times because Stripe can take a beat to mark the session
      // paid; giving up too early would leave the row at "pending".
      if (sessionId) {
        for (let attempt = 0; attempt < 5 && mounted; attempt++) {
          try {
            const res = await fetch("/api/verify-trial-payment", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session_id: sessionId }),
            });
            const json = (await res.json().catch(() => ({}))) as {
              verified?: boolean;
              paymentStatus?: string;
            };
            if (json.verified && json.paymentStatus === "paid") {
              try {
                localStorage.setItem(
                  "brj.dashboardAccess",
                  JSON.stringify({ paymentStatus: "paid" }),
                );
              } catch {
                // ignore localStorage failures
              }
              if (mounted) setVerified(true);
              // Nudge every mounted useTrialStatus (navbar etc.) to refetch.
              refreshTrialStatus();
              break;
            }
          } catch (err) {
            console.warn("[trial-success] verify retry", attempt + 1, err);
          }
          // Back off: 750ms, 1.5s, 3s, 6s between attempts.
          await new Promise((r) => setTimeout(r, 750 * 2 ** attempt));
        }
      }

      const { data } = await supabase.auth.getSession();
      const isAuthed = Boolean(data.session?.access_token);
      if (!mounted) return;
      setSignedIn(isAuthed);
      if (!isAuthed) return;

      try {
        // Link the guest/Stripe trial row to this auth account, then refresh.
        await fetch("/api/link-trial", {
          method: "POST",
          credentials: "include",
          headers: { ...(await authHeaders()) },
        });
      } catch {
        // non-blocking — /api/me also self-heals the link by email
      }
      refreshTrialStatus();
      // Payment unlocks the dashboard — send them in. Small delay so the
      // "trial active" confirmation registers before the redirect.
      setTimeout(() => {
        if (mounted) navigate("/dashboard", { replace: true });
      }, 1400);
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId, navigate]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden pb-16 pt-28 sm:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(232,25,44,0.20) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="relative mx-auto max-w-275 px-6 md:px-10">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center border border-[#E8192C] bg-[#E8192C]/10"
          >
            <CheckCircle2 size={40} className="text-[#E8192C]" />
          </motion.div>

          <p className="mb-3 text-center font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            Payment Confirmed · Trial Active
          </p>
          <h1 className="mx-auto max-w-3xl text-center font-['Bebas_Neue'] text-5xl leading-[0.95] sm:text-7xl">
            YOU'RE IN.
            <br />
            YOUR 7 DAYS START NOW.
          </h1>

          {signedIn ? (
            <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-white/60">
              Your trial is active. Taking you to your dashboard…
            </p>
          ) : (
            <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-white/60">
              Payment confirmed. Create your account with{" "}
              <span className="text-white">the same email you paid with</span>{" "}
              to open your 7-day trial dashboard.
            </p>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {signedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-[#E8192C] px-8 py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#c2142340]"
              >
                Go to my dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/signup?redirect=/dashboard"
                  className="inline-flex items-center gap-2 bg-[#E8192C] px-8 py-4 font-['DM_Mono'] text-[12px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#c21423]"
                >
                  Create my account <ArrowRight size={15} />
                </Link>
                <Link
                  to="/auth/login?redirect=/dashboard"
                  className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/50 underline underline-offset-4 hover:text-white"
                >
                  I already have an account
                </Link>
              </>
            )}
          </div>

          {sessionId && (
            <p className="mt-8 text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/25">
              Order ID: {sessionId.slice(0, 18)}…
              {verified ? " · verified" : ""}
            </p>
          )}

          <p className="mx-auto mt-12 max-w-2xl text-center text-[13px] leading-relaxed text-white/40">
            Want a 1:1 with Ron to set your baseline? It's optional —{" "}
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-white/70 underline underline-offset-4 hover:text-white"
            >
              book a discovery call
            </a>{" "}
            any time during your trial.
          </p>
        </div>
      </section>
    </main>
  );
}
