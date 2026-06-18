import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthBrand from "@/components/auth/AuthBrand";

function getStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return { checks, score, color: colors[score] ?? "", label: labels[score] ?? "" };
}

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
    // text-base on mobile (16px) prevents iOS Safari zoom-on-focus.
    "font-['DM_Sans'] text-white text-base sm:text-sm placeholder:text-white/20",
    "transition-colors duration-200",
    hasError
      ? "border-red-500/60 focus:border-red-500"
      : "border-[#1c1c1c] focus:border-[#E8192C]",
  ].join(" ");
}

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectTo)}`;
  const { signUp, signInWithGoogle, isAuthenticated, loading } = useAuth();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = getStrength(form.password);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate(redirectTo, { replace: true });
  }, [isAuthenticated, loading, navigate, redirectTo]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2)
      e.fullName = "Please enter your full name.";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Please enter a valid email address.";
    if (!form.password || form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) e.confirm = "Passwords don't match.";
    if (!consent) e.consent = "You must agree to continue.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    const { error } = await signUp(form.email, form.password, form.fullName);

    if (error) {
      const msg = error.message || "";
      setServerError(
        /already registered|already.+exists/i.test(msg)
          ? "This email is already registered. Sign in instead."
          : msg || "Something went wrong. Please try again."
      );
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setServerError("");
    const { error } = await signInWithGoogle(redirectTo);
    if (error) {
      setServerError(error.message || "Google sign-in failed. Try again.");
      setGoogleLoading(false);
    }
  }

  if (status === "success") {
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
            Account Created
          </p>
          <h1 className="font-['Bebas_Neue'] text-5xl text-white mb-4 leading-none">
            CHECK YOUR EMAIL.
          </h1>
          <p className="font-['DM_Sans'] text-white/60 text-base leading-relaxed mb-8">
            We sent a confirmation link to{" "}
            <span className="text-white font-medium">{form.email}</span>. Click it to activate your
            account — it lands in under 2 minutes.
          </p>
          <p className="font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/25 uppercase">
            No email? Check your spam folder.
          </p>
          <div className="mt-10 pt-8 border-t border-[#1c1c1c]">
            <Link
              to={loginHref}
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
              "NO PERFECT LIFE REQUIRED.
              <br />
              SHOW UP.
              <br />
              STAY CONSISTENT."
            </blockquote>
            <p className="font-['DM_Mono'] text-[11px] tracking-[0.25em] text-[#E8192C] mb-10">
              — BIGRONJONES®
            </p>

            <div className="flex gap-8">
              {[
                { val: "20+", label: "Years Coaching" },
                { val: "2,000+", label: "Members" },
                { val: "4.9/5", label: "Rating" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-['Bebas_Neue'] text-[#E8192C] text-2xl leading-none">
                    {s.val}
                  </p>
                  <p className="font-['DM_Mono'] text-[9px] tracking-[0.2em] text-white/30 uppercase mt-1">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-16 lg:px-14 xl:px-20 overflow-y-auto">
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
              JOIN THE SYSTEM.
            </h1>
            <p className="font-['DM_Sans'] text-white/50 text-sm leading-relaxed">
              Create your free account and step into 20+ years of real-world coaching.
            </p>
          </div>

          <motion.button
            onClick={handleGoogle}
            disabled={googleLoading || status === "submitting"}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-[#050505] font-['DM_Sans'] font-semibold text-sm hover:bg-white/90 transition-all duration-200 disabled:opacity-60 mb-3"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-[#050505] border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Connecting to Google..." : "Continue with Google"}
          </motion.button>

          <p className="mb-5 flex flex-wrap items-center justify-center gap-1.5 text-center font-['DM_Sans'] text-[11px] text-white/40">
            <ShieldCheck size={12} className="text-[#E8192C]/70" />
            Secure sign-up — we never see your password
          </p>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-[1px] bg-[#1c1c1c]" />
            <span className="font-['DM_Mono'] text-[10px] tracking-[0.25em] text-white/25">OR</span>
            <div className="flex-1 h-[1px] bg-[#1c1c1c]" />
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
                FULL NAME <span className="text-[#E8192C]">*</span>
              </label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className={inputCls(!!errors.fullName)}
              />
              {errors.fullName && (
                <p className="mt-1.5 flex items-center gap-1 font-['DM_Sans'] text-xs text-red-400">
                  <AlertCircle size={11} />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
                EMAIL ADDRESS <span className="text-[#E8192C]">*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls(!!errors.email)}
              />
              {errors.email && (
                <p className="mt-1.5 flex items-center gap-1 font-['DM_Sans'] text-xs text-red-400">
                  <AlertCircle size={11} />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
                PASSWORD <span className="text-[#E8192C]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputCls(!!errors.password) + " pr-12"}
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

              <AnimatePresence>
                {form.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2 overflow-hidden"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              strength.score >= level ? strength.color : "#1c1c1c",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {[
                        ["8+ chars", strength.checks.length],
                        ["Uppercase", strength.checks.upper],
                        ["Number", strength.checks.number],
                        ["Symbol", strength.checks.special],
                      ].map(([label, ok]) => (
                        <span
                          key={label as string}
                          className="flex items-center gap-1 font-['DM_Mono'] text-[9px] tracking-wider transition-colors"
                          style={{ color: ok ? "#22c55e" : "#444" }}
                        >
                          <Check size={9} strokeWidth={3} />
                          {label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 font-['DM_Sans'] text-xs text-red-400">
                  <AlertCircle size={11} />
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
                CONFIRM PASSWORD <span className="text-[#E8192C]">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  className={inputCls(!!errors.confirm)}
                />
                {form.confirm.length > 0 && (
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                    style={{
                      color: form.password === form.confirm ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {form.password === form.confirm ? "✓" : "✗"}
                  </span>
                )}
              </div>
              {errors.confirm && (
                <p className="mt-1.5 flex items-center gap-1 font-['DM_Sans'] text-xs text-red-400">
                  <AlertCircle size={11} />
                  {errors.confirm}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={[
                      "w-5 h-5 border-2 flex items-center justify-center transition-all duration-150",
                      consent
                        ? "bg-[#E8192C] border-[#E8192C]"
                        : "bg-transparent border-[#1c1c1c] group-hover:border-[#555]",
                    ].join(" ")}
                  >
                    {consent && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="font-['DM_Sans'] text-xs text-white/40 leading-relaxed">
                  I agree to receive my guide and follow-up coaching emails from BigRonJones®. I
                  can unsubscribe anytime.{" "}
                  <Link to="/terms" className="underline hover:text-white/60 transition-colors">
                    Terms
                  </Link>
                  {" & "}
                  <Link
                    to="/privacy"
                    className="underline hover:text-white/60 transition-colors"
                  >
                    Privacy
                  </Link>
                  .
                </span>
              </label>
              {errors.consent && (
                <p className="mt-1.5 flex items-center gap-1 font-['DM_Sans'] text-xs text-red-400 ml-8">
                  <AlertCircle size={11} />
                  {errors.consent}
                </p>
              )}
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-3 p-3.5 bg-[#E8192C]/10 border border-[#E8192C]/30"
                >
                  <AlertCircle size={14} className="text-[#E8192C] flex-shrink-0 mt-0.5" />
                  <p className="font-['DM_Sans'] text-sm text-[#E8192C]">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={status === "submitting" || googleLoading}
              className="w-full py-4 bg-[#E8192C] text-white font-['Bebas_Neue'] text-xl tracking-widest hover:bg-[#b50f1f] transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-3 mt-2"
              whileHover={{ scale: status !== "submitting" ? 1.01 : 1 }}
              whileTap={{ scale: status !== "submitting" ? 0.99 : 1 }}
            >
              {status === "submitting" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  CREATING ACCOUNT...
                </>
              ) : (
                "CREATE MY ACCOUNT"
              )}
            </motion.button>

            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-center">
              <Lock size={10} className="shrink-0 text-white/20" />
              <span className="font-['DM_Mono'] text-[9px] tracking-[0.2em] text-white/20 uppercase">
                256-bit encrypted · password never stored
              </span>
            </div>
          </form>

          <p className="text-center font-['DM_Sans'] text-sm text-white/40 mt-8">
            Already have an account?{" "}
            <Link
              to={loginHref}
              className="text-[#E8192C] hover:text-white transition-colors font-medium"
            >
              Sign in
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
