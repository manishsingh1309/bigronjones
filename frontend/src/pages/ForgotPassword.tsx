import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function inputCls(hasError: boolean) {
  return [
    "w-full bg-[#0a0a0a] border outline-none px-4 py-3.5",
    "font-['DM_Sans'] text-white text-sm placeholder:text-white/20",
    "transition-colors duration-200",
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-[#1c1c1c] focus:border-[#E8192C]",
  ].join(" ");
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await resetPassword(email);
    setSubmitting(false);
    if (err) {
      setError(err.message || "Could not send reset email. Please try again.");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-[#E8192C] flex items-center justify-center mx-auto mb-8"
          >
            <Check size={36} className="text-white" strokeWidth={3} />
          </motion.div>
          <p className="font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C] mb-3 uppercase">
            Reset Link Sent
          </p>
          <h1 className="font-['Bebas_Neue'] text-5xl text-white mb-4 leading-none">
            CHECK YOUR EMAIL.
          </h1>
          <p className="font-['DM_Sans'] text-white/60 text-base leading-relaxed mb-8">
            If an account exists for <span className="text-white font-medium">{email}</span>,
            we've sent a password reset link. It expires in one hour.
          </p>
          <div className="mt-10 pt-8 border-t border-[#1c1c1c]">
            <Link
              to="/auth/login"
              className="font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 hover:text-white transition-colors uppercase"
            >
              ← Back to Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px]"
      >
        <Link
          to="/"
          className="font-['Bebas_Neue'] text-[20px] tracking-[0.2em] text-white mb-10 block"
        >
          BIGRONJONES
          <sup style={{ fontSize: "0.42em", verticalAlign: "super", lineHeight: 0 }}>®</sup>
        </Link>

        <div className="mb-8">
          <div className="w-8 h-[2px] bg-[#E8192C] mb-5" />
          <h1
            className="font-['Bebas_Neue'] text-white leading-[0.9] mb-3"
            style={{ fontSize: "clamp(2.5rem, 5vw, 3.8rem)" }}
          >
            RESET PASSWORD.
          </h1>
          <p className="font-['DM_Sans'] text-white/50 text-sm leading-relaxed">
            Enter the email tied to your account. We'll send you a secure reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls(!!error)}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-3.5 bg-[#E8192C]/10 border border-[#E8192C]/30"
              >
                <AlertCircle size={14} className="text-[#E8192C] flex-shrink-0 mt-0.5" />
                <p className="font-['DM_Sans'] text-sm text-[#E8192C]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#E8192C] text-white font-['Bebas_Neue'] text-xl tracking-widest hover:bg-[#b50f1f] transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                SENDING...
              </>
            ) : (
              "SEND RESET LINK"
            )}
          </motion.button>
        </form>

        <p className="text-center font-['DM_Sans'] text-sm text-white/40 mt-8">
          Remembered it?{" "}
          <Link
            to="/auth/login"
            className="text-[#E8192C] hover:text-white transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
