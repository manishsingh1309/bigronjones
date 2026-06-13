import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  X,
  Lock,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import { authHeaders } from "@/auth/api";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : Promise.resolve(null);
const TRIAL_CHECKOUT_PRICE = 2; // TEMP (live-payment test): revert to 149

type LegacyRedirectStripe = {
  redirectToCheckout?: (options: {
    sessionId: string;
  }) => Promise<{ error?: { message?: string } }>;
};

export default function CheckoutClient() {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const hydrated = useCart((s) => s.hydrated);
  const push = useToast((s) => s.push);
  const [submitting, setSubmitting] = useState(false);

  const checkoutItems = items.map((item) =>
    item.slug === "trial" && item.price <= 0
      ? { ...item, price: TRIAL_CHECKOUT_PRICE }
      : item,
  );
  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleComplete = async () => {
    if (items.length === 0) {
      console.warn("[checkout] No items in cart");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        // Shop cart purchases — backend uses the actual cart items as Stripe
        // line items and redirects to /success (not /trial/success).
        // Without this, the backend defaults to checkoutType="trial" and
        // forces the $149 trial line, charging the wrong amount and sending
        // buyers to Ron's discovery-call calendar regardless of what they bought.
        checkoutType: "shop" as const,
        total: subtotal,
        items: checkoutItems.map((i) => ({
          id: i.id,
          slug: i.slug,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      };

      console.log("[checkout] Sending request:", {
        url: "/api/checkout",
        itemsCount: payload.items.length,
        total: payload.total,
      });

      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify(payload),
      });

      console.log("[checkout] Response status:", res.status);

      // Handle network errors or invalid responses
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = `Checkout failed: ${res.status}`;

        if (contentType?.includes("application/json")) {
          try {
            const errorData = await res.json();
            console.error("[checkout] Server error response:", errorData);
            errorMessage = errorData.error || errorMessage;
          } catch (parseErr) {
            console.error(
              "[checkout] Failed to parse error response:",
              parseErr,
            );
            // Try to read raw text as fallback
            try {
              const raw = await res.text();
              console.error("[checkout] Raw error response:", raw);
            } catch (tErr) {
              console.error(
                "[checkout] Failed to read raw error response:",
                tErr,
              );
            }
          }
        } else {
          try {
            const raw = await res.text();
            console.error("[checkout] Non-JSON error response:", raw);
            errorMessage = raw || errorMessage;
          } catch (tErr) {
            console.error(
              "[checkout] Failed to read non-JSON error response:",
              tErr,
            );
          }
        }

        throw new Error(errorMessage);
      }

      // Parse response safely
      let data;
      try {
        data = await res.json();
        console.log("[checkout] Response data:", {
          id: data.id,
          hasUrl: !!data.url,
        });
      } catch (parseErr) {
        console.error("[checkout] Failed to parse success response:", parseErr);
        throw new Error("Invalid server response - unable to parse JSON");
      }

      // Prefer the hosted-checkout URL the server already returned. It works
      // identically in test/live mode and over HTTP, with no Stripe.js needed.
      if (data.url) {
        console.log("[checkout] Redirecting to Stripe Checkout URL", data.url);
        try {
          window.location.assign(data.url);
          return;
        } catch (redirErr) {
          console.error(
            "[checkout] Failed to redirect to Stripe URL:",
            redirErr,
          );
          throw redirErr;
        }
      }

      // Fallback: if only a session id came back, ask Stripe.js to redirect.
      if (data.id && stripePublishableKey) {
        const stripe = await stripePromise;
        const redirectToCheckout = (stripe as LegacyRedirectStripe | null)
          ?.redirectToCheckout;
        if (redirectToCheckout) {
          const redirectResult = await redirectToCheckout({
            sessionId: data.id,
          });
          if (redirectResult.error) {
            throw new Error(redirectResult.error.message);
          }
          return;
        }
      }

      throw new Error("No Stripe checkout session returned from server");
    } catch (err) {
      console.error("[checkout] Error:", err);
      push({
        title: "Something went wrong",
        description:
          err instanceof Error
            ? err.message
            : "Please try again — or email hello@bigronjones.com.",
        variant: "error",
      });
    } finally {
      // Always clear submitting state if we didn't navigate away
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1300px] px-6 md:px-10">
        <div className="h-32 animate-pulse bg-[#0f0f0f]" />
      </div>
    );
  }

  if (items.length < 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center bg-[#E8192C]">
            <CheckCircle2 size={36} strokeWidth={2.2} className="text-white" />
          </div>
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — ORDER RECEIVED
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
            Ron&apos;s team will be in touch within 24 hours to confirm your
            order and schedule your sessions. Check your email — including spam
            — for the welcome message.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
              Explore Programs
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
          — YOUR CART
        </p>
        <h1
          className="font-['Bebas_Neue'] leading-[0.92] text-white"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
        >
          NOTHING HERE <span className="text-[#E8192C]">YET.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
          Your cart is empty. Browse the programs Ron and the team built for
          real, measurable progress.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
          >
            Browse Programs
            <ArrowRight size={13} />
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
          >
            Visit the Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1300px] px-6 md:px-10">
      <div className="mb-10">
        <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
          — CHECKOUT
        </p>
        <h1
          className="font-['Bebas_Neue'] leading-[0.92] text-white"
          style={{ fontSize: "clamp(2.5rem, 6.5vw, 5rem)" }}
        >
          REVIEW YOUR <span className="text-[#E8192C]">ORDER.</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
        {/* Left: items */}
        <div className="flex flex-col">
          <h2 className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/60">
            Items ({items.length})
          </h2>
          <ul className="flex flex-col gap-3">
            <AnimatePresence>
              {checkoutItems.map((item) => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-4"
                >
                  <Link
                    to={`/shop/${item.slug}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#050505]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-cover object-top"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/shop/${item.slug}`}
                      className="font-['Bebas_Neue'] text-lg tracking-wide text-white hover:text-[#E8192C]"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                      {item.coach}
                    </p>
                    <p className="mt-2 font-['DM_Mono'] text-[11px] tracking-[0.15em] text-[#E8192C]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 border border-[#1a1a1a]">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-9 w-9 items-center justify-center text-white/60 transition-colors hover:bg-[#1a1a1a] hover:text-white"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-['DM_Mono'] text-sm text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                      className="flex h-9 w-9 items-center justify-center text-white/60 transition-colors hover:bg-[#1a1a1a] hover:text-white"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove from cart"
                    className="flex h-9 w-9 items-center justify-center text-white/40 transition-colors hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <Link
            to="/shop"
            className="mt-6 inline-flex w-fit font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white/60 transition-colors hover:text-white"
          >
            ← Continue shopping
          </Link>
        </div>

        {/* Right: summary */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-7">
            <h2 className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/60">
              Order Summary
            </h2>

            <ul className="mb-5 flex flex-col gap-2 border-b border-[#1a1a1a] pb-5 font-['DM_Sans'] text-sm">
              <li className="flex items-center justify-between text-white/65">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </li>
              <li className="flex items-center justify-between text-white/65">
                <span>Processing</span>
                <span>Free</span>
              </li>
            </ul>

            <div className="mb-6 flex items-baseline justify-between">
              <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.22em] text-white/60">
                Total
              </span>
              <span className="font-['Bebas_Neue'] text-3xl tracking-wide text-[#E8192C]">
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              disabled={submitting}
              className="relative w-full overflow-hidden bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-60"
              style={{
                animation: submitting
                  ? "none"
                  : "pulse-red 2.5s ease-in-out infinite",
              }}
            >
              {submitting ? "Processing..." : "Complete Purchase"}
            </motion.button>

            <p className="mt-4 font-['DM_Sans'] text-xs leading-relaxed text-white/50">
              We&apos;ll confirm your order by email within 24 hours and send
              your welcome materials. For consultations, you&apos;ll receive a
              calendar link to schedule.
            </p>

            <ul className="mt-6 flex flex-col gap-3 border-t border-[#1a1a1a] pt-5">
              {[
                { icon: Lock, label: "Secure checkout" },
                { icon: RefreshCw, label: "Cancel anytime" },
                { icon: ShieldCheck, label: "100% real coaching — no bots" },
              ].map((b) => (
                <li
                  key={b.label}
                  className="flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white/50"
                >
                  <b.icon size={12} className="text-[#E8192C]" />
                  {b.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes pulse-red {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(232, 25, 44, 0.45);
          }
          50% {
            box-shadow: 0 0 0 14px rgba(232, 25, 44, 0);
          }
        }
      `}</style>
    </div>
  );
}
