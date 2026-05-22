import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { refreshTrialStatus } from "@/hooks/useTrialStatus";
import CalendlyInline from "@/components/shared/CalendlyInline";

// slug → Calendly event URL. Add Ron's call here when his link is provided.
const CALENDLY_BY_SLUG: Record<string, { coach: string; url: string }> = {
  "private-nutrition-call": {
    coach: "Sean",
    url: "https://calendly.com/sgeno/nutrition-call-2",
  },
};

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clearCart);
  const { user } = useAuth();
  const sessionId = searchParams.get("session_id");

  // Capture the cart contents on first render BEFORE clearCart runs in the
  // effect below. The success page can otherwise lose track of what was
  // purchased the moment the cart is wiped, leaving us unable to render the
  // right post-purchase booking UI.
  const [purchasedSlugs] = useState<string[]>(() =>
    items.map((i) => i.slug),
  );

  // ?items=slug-a,slug-b — populated by the backend success_url. Acts as the
  // source of truth when the user lands here from a different device than the
  // one they checked out on (e.g. paying on phone, opening receipt on laptop).
  const urlSlugs = useMemo(
    () =>
      (searchParams.get("items") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams],
  );

  const allSlugs = urlSlugs.length > 0 ? urlSlugs : purchasedSlugs;
  const booking = allSlugs
    .map((slug) => CALENDLY_BY_SLUG[slug])
    .find(Boolean);

  useEffect(() => {
    if (sessionId) {
      clearCart();
      // Stripe just settled an order — flush any cached /api/me so the navbar
      // (admin link, member CTA) reflects the fresh state instead of waiting
      // for the next login.
      refreshTrialStatus();
    }
  }, [clearCart, sessionId]);

  if (!sessionId) {
    return <Navigate to="/checkout" replace />;
  }

  const userName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    null;
  const userEmail = user?.email || null;

  return (
    <>
      <title>Order Confirmed | BigRonJones</title>
      <meta name="description" content="Your BigRonJones order is confirmed." />
      <section className="bg-[#050505] pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center bg-[#E8192C]">
            <CheckCircle2 size={36} strokeWidth={2.2} className="text-white" />
          </div>
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — PAYMENT CONFIRMED
          </p>
          <h1
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            YOU&apos;RE IN.
            <br />
            <span className="text-[#E8192C]">LET&apos;S GET TO WORK.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
            {booking ? (
              <>
                Your receipt is on its way. Pick your 60-minute slot with{" "}
                {booking.coach} below — you&apos;ll get a calendar invite the
                moment you book.
              </>
            ) : (
              <>
                Your receipt is on its way. Ron&apos;s team will email your
                welcome materials within 24 hours. For consultations,
                you&apos;ll receive a calendar link separately.
              </>
            )}
          </p>
        </div>
      </section>

      {booking && (
        <section className="bg-[#050505] pb-20 md:pb-24">
          <div className="mx-auto max-w-[1100px] px-6 md:px-10">
            <div className="overflow-hidden border border-[#1a1a1a] bg-white">
              <div className="flex items-center gap-3 bg-[#0f0f0f] p-6 md:p-8">
                <div className="flex h-10 w-10 items-center justify-center bg-[#E8192C]">
                  <Calendar size={18} className="text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
                    — STEP 2 OF 2
                  </p>
                  <h2 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white md:text-3xl">
                    BOOK YOUR CALL WITH {booking.coach.toUpperCase()}
                  </h2>
                </div>
              </div>

              <CalendlyInline
                url={booking.url}
                prefill={{ name: userName, email: userEmail }}
                height={1100}
              />

              <p className="border-t border-[#eaeaea] bg-white px-6 py-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-[#050505]/50 md:px-8">
                Trouble seeing the calendar?{" "}
                <a
                  href={booking.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E8192C] underline hover:text-[#b50f1f]"
                >
                  Open it in a new tab
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#050505] pb-24 md:pb-32">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
            >
              Return Home
              <ArrowRight size={13} />
            </Link>
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
            >
              Explore More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
