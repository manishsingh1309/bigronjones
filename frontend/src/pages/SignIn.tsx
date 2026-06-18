import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthBrand from "@/components/auth/AuthBrand";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

function inputCls(hasError: boolean) {
  return [
    "w-full bg-[#0a0a0a] border outline-none px-4 py-3.5",
    // text-base on mobile (16px) prevents iOS Safari from auto-zooming on
    // focus. Shrink to text-sm only at sm+ where the zoom heuristic is off.
    "font-['DM_Sans'] text-white text-base sm:text-sm placeholder:text-white/20",
    "transition-colors duration-200",
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-[#1c1c1c] focus:border-[#E8192C]",
  ].join(" ");
}

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { signIn, signInWithGoogle, isAuthenticated, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, loading, navigate, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    if (err) {
      const msg = err.message || "";
      setError(
        /invalid|credentials/i.test(msg)
          ? "Wrong email or password. Please try again."
          : /email.*not.*confirmed|email.*confirmation/i.test(msg)
            ? "Please confirm your email — check your inbox for the link."
            : msg || "Sign in failed. Please try again.",
      );
      setSubmitting(false);
      return;
    }
    // On success, supabase fires onAuthStateChange synchronously, which
    // flips isAuthenticated → the useEffect above handles the navigate.
    // We avoid a manual navigate here so the redirect doesn't race the
    // state update on slow networks.
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const { error: err } = await signInWithGoogle(redirectTo);
    if (err) {
      setError(err.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex">
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/assets/ron-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#E8192C]" />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          <AuthBrand />

          <div>
            <div className="w-10 h-[2px] bg-[#E8192C] mb-6" />
            <blockquote
              className="font-['Bebas_Neue'] text-white leading-[0.92] mb-6"
              style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.5rem)" }}
            >
              "STRUCTURE REPLACES
              <br />
              GUESSWORK."
            </blockquote>
            <p className="font-['DM_Mono'] text-[11px] tracking-[0.25em] text-[#E8192C]">
              — BIGRONJONES®
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-16 lg:px-14 xl:px-20">
        <AuthBrand className="mb-10 lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px] mx-auto lg:mx-0"
        >
          <div className="mb-8">
            <div className="w-8 h-[2px] bg-[#E8192C] mb-5" />
            <h1
              className="font-['Bebas_Neue'] text-white leading-[0.9] mb-3"
              style={{ fontSize: "clamp(2.5rem, 5vw, 3.8rem)" }}
            >
              WELCOME BACK.
            </h1>
            <p className="font-['DM_Sans'] text-white/50 text-sm">
              Sign in to access your programs and track your progress.
            </p>
          </div>

          <motion.button
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-[#050505] font-['DM_Sans'] font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-60 mb-3"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[#050505] border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </motion.button>

          <p className="mb-5 flex flex-wrap items-center justify-center gap-1.5 text-center font-['DM_Sans'] text-[11px] text-white/40">
            <ShieldCheck size={12} className="text-[#E8192C]/70" />
            Secure sign-in — we never see your password
          </p>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-[1px] bg-[#1c1c1c]" />
            <span className="font-['DM_Mono'] text-[10px] tracking-[0.25em] text-white/25">OR</span>
            <div className="flex-1 h-[1px] bg-[#1c1c1c]" />
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
                className={inputCls(false)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40">
                  PASSWORD
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="font-['DM_Mono'] text-[10px] tracking-[0.15em] text-white/30 hover:text-[#E8192C] transition-colors"
                >
                  FORGOT?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls(false) + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
              disabled={submitting || googleLoading}
              className="w-full py-4 bg-[#E8192C] text-white font-['Bebas_Neue'] text-xl tracking-widest hover:bg-[#b50f1f] transition-colors disabled:opacity-60 flex items-center justify-center gap-3 mt-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  SIGNING IN...
                </>
              ) : (
                "SIGN IN"
              )}
            </motion.button>

            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-center">
              <Lock size={10} className="shrink-0 text-white/20" />
              <span className="font-['DM_Mono'] text-[9px] tracking-[0.2em] text-white/20 uppercase">
                256-bit encrypted · data stays private
              </span>
            </div>
          </form>

          <p className="text-center font-['DM_Sans'] text-sm text-white/40 mt-8">
            Don't have an account?{" "}
            <Link
              to={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-[#E8192C] hover:text-white transition-colors font-medium"
            >
              Create one free
            </Link>
          </p>

          <div className="mt-8 border-t border-[#141414] pt-5 text-center">
            <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white/25">
              Private coaching platform · BigRonJones® LLC
            </p>
            <div className="mt-2 flex items-center justify-center gap-4">
              <Link
                to="/privacy"
                className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.15em] text-white/35 transition-colors hover:text-[#E8192C]"
              >
                Privacy
              </Link>
              <span className="text-white/15">·</span>
              <Link
                to="/terms"
                className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.15em] text-white/35 transition-colors hover:text-[#E8192C]"
              >
                Terms
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
