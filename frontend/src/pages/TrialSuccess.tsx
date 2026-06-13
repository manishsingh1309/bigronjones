import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";
import { refreshTrialStatus } from "@/hooks/useTrialStatus";

// Private 1:1 starting call with Ron — the first step after payment.
const CALENDLY_URL = "https://calendly.com/bigronjonesllc/discovery-call";

export default function TrialSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    document.title = "Payment Confirmed — Your Trial Is Active | BigRonJones®";
  }, []);

  // 1) Verify the Stripe session against Stripe's API. This flips the user's
  //    payment_status to "paid" AND starts the 7-day trial (trial_start_date)
  //    server-side — the redirect-based equivalent of the Stripe webhook.
  // 2) If signed in, stamp auth_user_id on the trial row (link-trial) so the
  //    dashboard opens. We do NOT auto-redirect — the user books their 1:1
  //    starting call first (Step 1), then opens the dashboard (Step 2).
  useEffect(() => {
    let mounted = true;
    (async () => {
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
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="relative overflow-hidden pb-20 pt-28 sm:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(232,25,44,0.20) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 md:px-10">
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
            YOU&apos;RE IN.
            <br />
            YOUR 7 DAYS START NOW.
          </h1>

          {signedIn === false ? (
            /* Paid but not signed in — they must create / sign into an account
               (same email they paid with) to book and open the dashboard. */
            <>
              <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-white/60">
                Payment confirmed. Create your account with{" "}
                <span className="text-white">the same email you paid with</span>{" "}
                to book your call and open your 7-day trial dashboard.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
              </div>
            </>
          ) : (
            /* Signed-in trial buyer (the normal path): two ordered steps —
               1) book the private 1:1 starting call with Ron, then
               2) open the 7-day trial dashboard. */
            <>
              <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-white/60">
                Two quick steps to kick off your week.
              </p>
              <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4">
                {/* Step 1 — book the call (primary) */}
                <div className="flex flex-col gap-4 border border-[#E8192C]/40 bg-[#E8192C]/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8192C] font-['Bebas_Neue'] text-xl leading-none text-white">
                      1
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2 font-['Bebas_Neue'] text-2xl tracking-wide text-white">
                        <CalendarCheck size={18} className="text-[#E8192C]" />
                        Book your call with Ron
                      </h3>
                      <p className="mt-1 text-[14px] leading-relaxed text-white/55">
                        Lock in your private 1:1 starting call so Ron can set
                        your baseline before Day 1.
                      </p>
                    </div>
                  </div>
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#E8192C] px-6 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#c21423]"
                  >
                    Book Call <ArrowRight size={14} />
                  </a>
                </div>

                {/* Step 2 — open the dashboard */}
                <div className="flex flex-col gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E8192C]/50 font-['Bebas_Neue'] text-xl leading-none text-white">
                      2
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2 font-['Bebas_Neue'] text-2xl tracking-wide text-white">
                        <LayoutDashboard size={18} className="text-[#E8192C]" />
                        Open your 7-day dashboard
                      </h3>
                      <p className="mt-1 text-[14px] leading-relaxed text-white/55">
                        Watch each day&apos;s lesson, log your metrics, and
                        unlock the next day.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className="inline-flex shrink-0 items-center justify-center gap-2 border border-[#1c1c1c] px-6 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:border-[#E8192C]"
                  >
                    Go to Dashboard <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </>
          )}

          {sessionId && (
            <p className="mt-10 text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/25">
              Order ID: {sessionId.slice(0, 18)}…
              {verified ? " · verified" : ""}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
