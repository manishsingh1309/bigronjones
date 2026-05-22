import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { authHeaders } from "@/auth/api";
import { supabase } from "@/auth/supabase";
import { refreshTrialStatus } from "@/hooks/useTrialStatus";

const CALENDLY_URL = "https://calendly.com/bigronjonesllc/discovery-call";

export default function TrialSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [showCalendly, setShowCalendly] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Payment Confirmed — Book Your Call | BigRonJones®";
  }, []);

  // Reveal the Calendly embed after a beat so the success state lands first.
  useEffect(() => {
    const t = setTimeout(() => setShowCalendly(true), 1800);
    return () => clearTimeout(t);
  }, []);

  // 1) Verify the Stripe session against Stripe's API and flip the user's
  //    payment_status to 'paid'. This is the redirect-based equivalent of a
  //    Stripe webhook — without it, the dashboard would think the user
  //    hadn't paid and gate them out.
  // 2) If the user is signed in, also stamp auth_user_id on the trial row.
  useEffect(() => {
    let mounted = true;
    (async () => {
      // Verify payment first — this works whether or not the user is signed in.
      // We retry a few times because Stripe can take a beat to mark the
      // checkout session as `payment_status=paid`. If we give up too fast the
      // DB row stays at `pending` and the user gets re-paywalled on re-login.
      if (sessionId) {
        let verified = false;
        for (let attempt = 0; attempt < 5 && mounted && !verified; attempt++) {
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
            console.log("[trial-success] verify attempt", attempt + 1, {
              status: res.status,
              verified: json.verified,
              paymentStatus: json.paymentStatus,
            });
            if (json.verified && json.paymentStatus === "paid") {
              verified = true;
              try {
                localStorage.setItem(
                  "brj.dashboardAccess",
                  JSON.stringify({ paymentStatus: "paid" }),
                );
              } catch {
                // ignore localStorage failures
              }
              // Nudge every mounted useTrialStatus (navbar etc.) to refetch
              // /api/me so the dropdown immediately reflects "paid" status —
              // without this, the user would still see "Start 7-Day Trial"
              // until they logged out and back in.
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
        await fetch("/api/link-trial", {
          method: "POST",
          credentials: "include",
          headers: { ...(await authHeaders()) },
        });
        // /api/link-trial stamps auth_user_id on the trial row — after which
        // /api/me will see the user as paid. Refresh so the navbar updates.
        refreshTrialStatus();
      } catch {
        // non-blocking
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    function handleCalendlyMessage(event: MessageEvent) {
      if (
        typeof event.origin !== "string" ||
        !event.origin.includes("calendly.com")
      ) {
        return;
      }

      const data = event.data as
        | { event?: string; payload?: Record<string, unknown> }
        | undefined;

      if (!data || typeof data !== "object") return;
      if (
        data.event !== "calendly.event_scheduled" &&
        data.event !== "event_scheduled"
      ) {
        return;
      }

      const payload = data.payload || {};
      const invitee = (payload.invitee as Record<string, unknown>) || {};
      const scheduledEvent =
        (payload.scheduled_event as Record<string, unknown>) ||
        (payload.event as Record<string, unknown>) ||
        {};
      const email = String(invitee.email || payload.email || "")
        .trim()
        .toLowerCase();
      const calendlyEventId = String(
        scheduledEvent.uri || scheduledEvent.event || payload.event_uri || "",
      ).trim();
      const bookingTime = new Date().toISOString();

      console.log("[trial-success] Calendly event scheduled:", {
        email,
        calendlyEventId,
        bookingTime,
      });

      try {
        localStorage.setItem(
          "brj.dashboardAccess",
          JSON.stringify({
            paymentStatus: "paid",
            bookingCompleted: true,
            bookingTime,
            calendlyEventId,
            userEmail: email || undefined,
          }),
        );
      } catch {
        // ignore localStorage failures
      }

      // Race condition: Calendly's iframe may attempt a top-level redirect
      // (configured by the Calendly admin "Redirect after scheduling" hook)
      // moments after firing this postMessage. Navigate immediately via
      // window.location.replace so our destination wins before the iframe
      // can hijack window.top.
      const goToDashboard = () => {
        try {
          window.location.replace("/dashboard");
        } catch {
          navigate("/dashboard", { replace: true });
        }
      };

      // Persist the booking server-side BEFORE redirecting. If we redirect
      // first, a slow /api/booking-completion request can be cancelled by the
      // page unload and the user lands on the dashboard with no trial dates
      // saved — which means a future logout/re-login sees them as unpaid.
      // We cap the wait so a hung request can't strand the user on this page.
      (async () => {
        try {
          await Promise.race([
            fetch("/api/booking-completion", {
              method: "POST",
              credentials: "include",
              keepalive: true,
              headers: {
                "Content-Type": "application/json",
                ...(await authHeaders()),
              },
              body: JSON.stringify({
                email,
                calendlyEventId,
                bookingTime,
                sessionId: sessionId || undefined,
              }),
            }),
            new Promise((resolve) => setTimeout(resolve, 4000)),
          ]);
        } catch (error) {
          console.error(
            "[trial-success] booking completion update failed:",
            error,
          );
        } finally {
          // Trial-start dates are populated server-side by
          // /api/booking-completion — refresh so the dashboard chrome shows
          // "Day 1/7" instead of the pre-booking state.
          refreshTrialStatus();
          goToDashboard();
        }
      })();
    }

    window.addEventListener("message", handleCalendlyMessage);
    return () => window.removeEventListener("message", handleCalendlyMessage);
  }, [navigate, sessionId]);

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
            Payment Confirmed · Step 2 of 9
          </p>
          <h1 className="mx-auto max-w-3xl text-center font-['Bebas_Neue'] text-5xl leading-[0.95] sm:text-7xl">
            YOU'RE IN.
            <br />
            BOOK YOUR CALL.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[15px] leading-relaxed text-white/60">
            Your trial does <span className="text-white">not</span> begin until
            you book your 1:1 discovery call with Ron. That's the structure.
            Pick a slot below — your dashboard unlocks the moment Ron's team
            confirms the booking.
          </p>

          {sessionId && (
            <p className="mt-4 text-center font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
              Order ID: {sessionId.slice(0, 18)}…
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-275 px-6 md:px-10">
          <div className="mb-6 flex items-center gap-3">
            <Clock size={18} className="text-[#E8192C]" />
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              Step 02 — Book Discovery Call
            </span>
          </div>

          {!showCalendly ? (
            <div className="flex h-150 items-center justify-center border border-border bg-surface">
              <div className="flex items-center gap-3 text-white/55">
                <span className="h-3 w-3 animate-pulse rounded-full bg-[#E8192C]" />
                <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em]">
                  Preparing your scheduler…
                </span>
              </div>
            </div>
          ) : (
            <CalendlyInlineWidget
              url={`${CALENDLY_URL}?utm_source=trial&utm_campaign=oversight7d&hide_gdpr_banner=1`}
            />
          )}

          <div className="mt-8 flex flex-col items-start gap-4 border-t border-border pt-8 text-[14px] text-white/60 md:flex-row md:items-center md:justify-between">
            <div>
              Already booked?{" "}
              <Link
                to={signedIn ? "/dashboard" : "/auth/signup"}
                className="ml-1 inline-flex items-center gap-2 text-white underline underline-offset-4"
              >
                {signedIn ? "Go to your dashboard" : "Create your account"}
                <ArrowRight size={14} />
              </Link>
            </div>
            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noreferrer"
              className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white"
            >
              Open in Calendly →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

// Loads Calendly's official inline widget script. Using their script (vs. a
// raw <iframe src=…>) is what suppresses Calendly's top-level redirect after
// scheduling — the embed keeps the post-booking view inside the widget and
// emits a `calendly.event_scheduled` postMessage, which our caller handles.
function CalendlyInlineWidget({ url }: { url: string }) {
  useEffect(() => {
    const SRC = "https://assets.calendly.com/assets/external/widget.js";
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (existing) return;
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="overflow-hidden border border-border bg-surface">
      <div
        className="calendly-inline-widget"
        data-url={url}
        style={{ minWidth: 320, height: 760, width: "100%" }}
      />
      <noscript>
        <p className="p-6 text-white/60">
          Calendly requires JavaScript. Open{" "}
          <a
            className="text-[#E8192C] underline"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            this link
          </a>{" "}
          to book your call.
        </p>
      </noscript>
    </div>
  );
}
