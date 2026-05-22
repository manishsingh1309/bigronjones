import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const TOPICS = [
  "Coaching question",
  "Press / Media",
  "Sponsorships / Partnerships",
  "Tech / Site issue",
  "Other",
];

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: TOPICS[0],
    message: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[400px] flex-col items-center justify-center border border-[#1a1a1a] bg-[#0f0f0f] p-10 text-center"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center bg-[#E8192C]">
          <CheckCircle2 size={28} strokeWidth={2.4} className="text-white" />
        </div>
        <p className="mb-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.28em] text-[#E8192C]">
          — MESSAGE SENT
        </p>
        <h2
          className="font-['Bebas_Neue'] leading-[0.95] text-white"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          THANKS — WE&apos;LL BE
          <br />
          <span className="text-[#E8192C]">IN TOUCH SOON.</span>
        </h2>
        <p className="mt-4 max-w-md font-['DM_Sans'] text-sm text-white/60">
          Most replies go out within 24 hours, weekdays.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[#1a1a1a] bg-[#0f0f0f] p-6 md:p-8"
    >
      <Field label="Your name" htmlFor="c-name">
        <input
          id="c-name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Email" htmlFor="c-email">
        <input
          id="c-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Topic" htmlFor="c-topic">
        <select
          id="c-topic"
          value={form.topic}
          onChange={(e) => update("topic", e.target.value)}
          className={inputCls}
        >
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <Field label="Message" htmlFor="c-message">
        <textarea
          id="c-message"
          required
          rows={6}
          minLength={10}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          className={`${inputCls} resize-y`}
        />
      </Field>

      {errorMsg && (
        <p className="mb-4 border-l-2 border-amber-500 bg-amber-500/10 px-3 py-2 font-['DM_Sans'] text-sm text-amber-300">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="inline-flex items-center justify-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-60"
      >
        {state === "loading" ? "Sending..." : "Send Message"}
        <ArrowRight size={13} />
      </button>
    </form>
  );
}

const inputCls =
  "w-full border border-[#1a1a1a] bg-[#050505] px-4 py-3 font-['DM_Sans'] text-[15px] text-white placeholder-white/30 outline-none transition-colors focus:border-[#E8192C]";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
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
    </div>
  );
}
