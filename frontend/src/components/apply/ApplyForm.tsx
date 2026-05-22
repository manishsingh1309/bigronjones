import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

const PROGRAMS = [
  { id: "mens", label: "Men's Fitness Alliance" },
  { id: "womens", label: "Women's Wellness Program" },
  { id: "trial", label: "Not Sure / Start with the 7-Day Trial" },
];

const GOALS = [
  "Build Muscle",
  "Lose Fat",
  "Improve Energy",
  "Accountability",
  "Nutrition Help",
  "Overall Health",
];

const COMMITMENT_OPTIONS = [
  "1-2 sessions / week",
  "3-4 sessions / week",
  "5+ sessions / week",
  "Whatever Ron tells me",
];

const EXPERIENCE_OPTIONS = [
  "Brand new to structured training",
  "Some experience, off-and-on",
  "Consistent for 6+ months",
  "Years of training under my belt",
];

export default function ApplyForm() {
  const [params] = useSearchParams();
  const initialProgram = params.get("program") || "mens";

  const [step, setStep] = useState(1);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    program: initialProgram,
    name: "",
    email: "",
    phone: "",
    experience: EXPERIENCE_OPTIONS[1],
    commitment: COMMITMENT_OPTIONS[1],
    goals: [] as string[],
    obstacles: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleGoal = (g: string) =>
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(g)
        ? f.goals.filter((x) => x !== g)
        : [...f.goals, g],
    }));

  const canAdvance =
    step === 1
      ? !!form.program && !!form.name && !!form.email
      : step === 2
        ? form.goals.length > 0 && form.obstacles.trim().length >= 10
        : true;

  const handleSubmit = async () => {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Combine goals/obstacles into the goals field the API expects
          goals: `Goals: ${form.goals.join(", ")}\n\nBiggest obstacle: ${form.obstacles}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong");
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center bg-[#E8192C]">
            <CheckCircle2 size={36} strokeWidth={2.2} className="text-white" />
          </div>
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — APPLICATION RECEIVED
          </p>
          <h2
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
          >
            WE&apos;LL BE IN TOUCH
            <br />
            <span className="text-[#E8192C]">WITHIN 48 HOURS.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
            Ron reviews every application personally. Check your email
            (including spam) for confirmation, and we&apos;ll reach out with
            next steps.
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
              to="/blog"
              className="inline-flex items-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
            >
              Read the Blog
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 md:px-10">
      {/* Progress dots */}
      <div className="mb-6 flex items-center gap-2">
        <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
          STEP {step} OF 3
        </span>
        <div className="ml-3 flex flex-1 gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-[3px] flex-1 transition-colors ${
                n <= step ? "bg-[#E8192C]" : "bg-[#1a1a1a]"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 1 && (
            <div>
              <h2
                className="mb-6 font-['Bebas_Neue'] leading-[0.95] text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                WHO ARE YOU?
              </h2>

              <fieldset className="mb-6">
                <legend className="mb-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.22em] text-white/60">
                  Program of interest
                </legend>
                <div className="flex flex-col gap-2">
                  {PROGRAMS.map((p) => (
                    <label
                      key={p.id}
                      className={`cursor-pointer border p-4 transition-colors ${
                        form.program === p.id
                          ? "border-[#E8192C] bg-[#E8192C]/5"
                          : "border-[#1a1a1a] bg-[#0f0f0f] hover:border-white/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="program"
                        value={p.id}
                        checked={form.program === p.id}
                        onChange={(e) => update("program", e.target.value)}
                        className="sr-only"
                      />
                      <span className="font-['DM_Sans'] text-[15px] text-white">
                        {p.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field label="Your name" htmlFor="name">
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Email" htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone (optional)" htmlFor="phone">
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2
                className="mb-6 font-['Bebas_Neue'] leading-[0.95] text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                WHAT&apos;S YOUR GOAL?
              </h2>

              <fieldset className="mb-6">
                <legend className="mb-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.22em] text-white/60">
                  Primary goals (pick all that apply)
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => {
                    const active = form.goals.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGoal(g)}
                        className={`px-4 py-3 text-left font-['DM_Sans'] text-sm transition-colors ${
                          active
                            ? "border border-[#E8192C] bg-[#E8192C]/10 text-white"
                            : "border border-[#1a1a1a] bg-[#0f0f0f] text-white/70 hover:border-white/30"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <Field
                label="Biggest obstacle right now"
                htmlFor="obstacles"
                hint="Be specific. What's been holding you back?"
              >
                <textarea
                  id="obstacles"
                  required
                  rows={4}
                  value={form.obstacles}
                  onChange={(e) => update("obstacles", e.target.value)}
                  className={`${inputCls} resize-y`}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2
                className="mb-6 font-['Bebas_Neue'] leading-[0.95] text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                FINAL DETAILS.
              </h2>

              <Field label="Training experience" htmlFor="experience">
                <select
                  id="experience"
                  value={form.experience}
                  onChange={(e) => update("experience", e.target.value)}
                  className={inputCls}
                >
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>

              <Field label="What you can commit to" htmlFor="commitment">
                <select
                  id="commitment"
                  value={form.commitment}
                  onChange={(e) => update("commitment", e.target.value)}
                  className={inputCls}
                >
                  {COMMITMENT_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>

              <div className="mt-6 border border-[#1a1a1a] bg-[#0f0f0f] p-5">
                <p className="mb-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white/50">
                  What happens next
                </p>
                <ul className="flex flex-col gap-1.5 font-['DM_Sans'] text-sm text-white/75">
                  <li>· Ron personally reviews your application</li>
                  <li>· Response within 48 hours, weekdays</li>
                  <li>· If accepted, we schedule a 30-minute intro call</li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {errorMsg && (
        <p className="mt-4 border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 font-['DM_Sans'] text-sm text-amber-300">
          {errorMsg}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-5 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white disabled:opacity-30"
        >
          <ArrowLeft size={13} />
          Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-40"
          >
            Continue
            <ArrowRight size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={state === "loading"}
            className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-60"
          >
            {state === "loading" ? "Submitting..." : "Submit Application"}
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      <p className="mt-4 font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white/40">
        Reviewed personally · 48-hour response · No automatic enrollment
      </p>
    </div>
  );
}

const inputCls =
  "w-full border border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3 font-['DM_Sans'] text-[15px] text-white placeholder-white/30 outline-none transition-colors focus:border-[#E8192C]";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label
        htmlFor={htmlFor}
        className="mb-2 block font-['DM_Mono'] text-[11px] uppercase tracking-[0.22em] text-white/60"
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1.5 font-['DM_Sans'] text-xs text-white/40">{hint}</p>
      )}
    </div>
  );
}
