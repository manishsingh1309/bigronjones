import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

type FormState = "idle" | "loading" | "success" | "error";

export default function NewsletterSection() {
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage-newsletter" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Subscription failed");
        setState("error");
        return;
      }
      setState("success");
      setEmail("");
    } catch {
      setErrorMsg("Network error. Try again.");
      setState("error");
    }
  };

  return (
    <section
      id="newsletter"
      className="relative overflow-hidden py-24"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,0.22), transparent 28%), radial-gradient(circle at top right, rgba(225,29,72,0.18), transparent 26%), linear-gradient(135deg, #020617 0%, #0b1020 48%, #050505 100%)",
      }}
    >
      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <AnimatePresence mode="wait">
          {state === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <CheckCircle size={64} className="text-brand-blue" />
              </motion.div>
              <h2 className="mt-6 font-heading text-4xl uppercase tracking-wider text-white md:text-5xl">
                You&apos;re In!
              </h2>
              <p className="mt-4 text-gray-300 font-body">
                Check your inbox for a welcome message from Ron.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-heading text-4xl uppercase tracking-wider text-white md:text-6xl">
                Get Free Weekly Wins
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-brand-gray-light font-body">
                No spam. Just Ron&apos;s best practical advice, workout tips,
                and motivation delivered to your inbox every week.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 rounded-full border border-brand-blue/30 bg-[#111827] px-6 py-4 text-white placeholder-brand-gray outline-none transition-colors focus:border-brand-red font-body"
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="rounded-full bg-brand-red px-8 py-4 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-brand-red-light disabled:opacity-70 font-body"
                >
                  {state === "loading" ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    "JOIN FREE"
                  )}
                </button>
              </form>

              <p className="mt-6 text-sm text-brand-gray-light font-body">
                Join 2,000+ people already getting smarter about their fitness.
              </p>

              <div className="mt-4 flex justify-center gap-4">
                {["No Spam", "Unsubscribe Anytime", "Free Forever"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-brand-gray-light font-body"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>

              {state === "error" && (
                <p className="mt-4 text-sm text-amber-300 font-body">
                  {errorMsg}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
