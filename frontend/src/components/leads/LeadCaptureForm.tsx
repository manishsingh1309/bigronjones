import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Download, Lock } from "lucide-react";
import { LeadFormSchema, type LeadFormData } from "@/lib/leadSchemas";

type Props = {
  magnetSlug: string;
  magnetTitle: string;
  onSuccess?: (data: { firstName: string; email: string }) => void;
  utmSource?: string;
  utmCampaign?: string;
  utmContent?: string;
};

type Status = "idle" | "submitting" | "success" | "error";

export default function LeadCaptureForm({
  magnetSlug,
  onSuccess,
  utmSource = "website",
  utmCampaign = "",
  utmContent = "",
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{
    firstName: string;
    email: string;
    emailSent: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(LeadFormSchema),
    defaultValues: { consent: false },
  });

  const onSubmit = async (data: LeadFormData) => {
    setStatus("submitting");
    setErrorMsg("");

    try {
      const response = await fetch("/api/capture-lead", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          lead_magnet_slug: magnetSlug,
          utm_source: utmSource,
          utm_campaign: utmCampaign,
          utm_content: utmContent,
          referrer_url:
            typeof document !== "undefined" ? document.referrer : "",
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const successInfo = {
          firstName: result.firstName,
          email: data.email,
          emailSent: result.emailSent !== false,
        };
        setSuccessData(successInfo);
        setStatus("success");
        onSuccess?.(successInfo);
      } else {
        setErrorMsg(result.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success" && successData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-20 h-20 bg-[#E8192C] rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Download size={32} className="text-white" />
        </motion.div>

        {successData.emailSent ? (
          <>
            <h3 className="font-['Bebas_Neue'] text-4xl text-white mb-3">
              CHECK YOUR EMAIL,
              <br />
              <span className="text-[#E8192C]">
                {successData.firstName.toUpperCase()}.
              </span>
            </h3>

            <p className="font-['DM_Sans'] text-white/60 text-base leading-relaxed max-w-sm mx-auto mb-6">
              Your guide is on its way to{" "}
              <span className="text-white font-medium">
                {successData.email}
              </span>
              . Check your inbox &mdash; it should arrive in under 2 minutes.
            </p>

            <p className="font-['DM_Mono'] text-[10px] tracking-[0.25em] text-white/30 uppercase">
              Check spam if you don&apos;t see it
            </p>
          </>
        ) : (
          <>
            <h3 className="font-['Bebas_Neue'] text-4xl text-white mb-3">
              GOT IT,
              <br />
              <span className="text-[#E8192C]">
                {successData.firstName.toUpperCase()}.
              </span>
            </h3>

            <p className="font-['DM_Sans'] text-white/60 text-base leading-relaxed max-w-sm mx-auto mb-6">
              Our email system hit a snag, but your details are saved against{" "}
              <span className="text-white font-medium">
                {successData.email}
              </span>
              . Ron will send the content over personally within 24 hours.
            </p>

            <p className="font-['DM_Mono'] text-[10px] tracking-[0.25em] text-white/30 uppercase">
              No need to resubmit
            </p>
          </>
        )}
      </motion.div>
    );
  }

  // Note: keep text at 16px (text-base) on mobile so iOS Safari doesn't
  // auto-zoom on focus. Shrink to text-sm only at sm+ where touch keyboards
  // don't trigger the zoom heuristic.
  const fieldClass = (hasError: boolean) =>
    `w-full bg-[#0d0d0d] border outline-none px-4 py-3.5 font-['DM_Sans'] text-white text-base sm:text-sm placeholder:text-white/20 transition-colors duration-200 ${
      hasError
        ? "border-red-500/60 focus:border-red-500"
        : "border-[#1c1c1c] focus:border-[#E8192C]"
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
          FULL NAME <span className="text-[#E8192C]">*</span>
        </label>
        <input
          {...register("full_name")}
          type="text"
          autoComplete="name"
          placeholder="Your full name"
          className={fieldClass(!!errors.full_name)}
        />
        {errors.full_name && (
          <p className="mt-1.5 font-['DM_Sans'] text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={11} /> {errors.full_name.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
          EMAIL ADDRESS <span className="text-[#E8192C]">*</span>
        </label>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          className={fieldClass(!!errors.email)}
        />
        {errors.email && (
          <p className="mt-1.5 font-['DM_Sans'] text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={11} /> {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-['DM_Mono'] text-[10px] tracking-[0.2em] text-white/40 mb-2">
          PHONE NUMBER <span className="text-white/20">(OPTIONAL)</span>
        </label>
        <input
          {...register("phone")}
          type="tel"
          autoComplete="tel"
          placeholder="+1 (555) 000-0000"
          className={fieldClass(!!errors.phone)}
        />
        {errors.phone && (
          <p className="mt-1.5 font-['DM_Sans'] text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={11} /> {errors.phone.message}
          </p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 flex-shrink-0">
            <input
              {...register("consent")}
              type="checkbox"
              className="sr-only"
            />
            <div
              className={`w-5 h-5 border-2 flex items-center justify-center transition-colors duration-200 ${
                watch("consent")
                  ? "bg-[#E8192C] border-[#E8192C]"
                  : "bg-transparent border-[#1c1c1c] group-hover:border-[#555]"
              }`}
            >
              {watch("consent") && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="font-['DM_Sans'] text-xs text-white/40 leading-relaxed">
            I agree to receive the free guide and follow-up emails from
            BigRonJones. I can unsubscribe at any time.
          </span>
        </label>
        {errors.consent && (
          <p className="mt-1.5 font-['DM_Sans'] text-xs text-red-400 flex items-center gap-1 ml-8">
            <AlertCircle size={11} /> {errors.consent.message}
          </p>
        )}
      </div>

      <AnimatePresence>
        {status === "error" && errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-3 bg-[#E8192C]/10 border border-[#E8192C]/30"
          >
            <AlertCircle
              size={14}
              className="text-[#E8192C] flex-shrink-0 mt-0.5"
            />
            <p className="font-['DM_Sans'] text-sm text-[#E8192C]">
              {errorMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-4 bg-[#E8192C] text-white font-['Bebas_Neue'] text-xl tracking-widest hover:bg-[#b50f1f] transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-3"
        whileHover={{ scale: status !== "submitting" ? 1.01 : 1 }}
        whileTap={{ scale: status !== "submitting" ? 0.99 : 1 }}
      >
        {status === "submitting" ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            SENDING YOUR GUIDE...
          </>
        ) : (
          <>
            <Download size={18} />
            SEND ME THE FREE GUIDE
          </>
        )}
      </motion.button>

      <div className="flex items-center justify-center gap-2">
        <Lock size={11} className="text-white/20" />
        <p className="font-['DM_Mono'] text-[9px] tracking-[0.2em] text-white/25 uppercase">
          No spam. No sharing your info. Unsubscribe anytime.
        </p>
      </div>
    </form>
  );
}
