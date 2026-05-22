import { useEffect, useState } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Play, Link as LinkIcon, Star, Users, Clock } from "lucide-react";
import LeadCaptureForm from "@/components/leads/LeadCaptureForm";
import BrandName from "@/components/shared/BrandName";

type ContentType = "pdf" | "ebook" | "youtube" | "url" | "file";

type Magnet = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type?: ContentType;
  pdf_url: string | null;
  external_url?: string | null;
  cta_text?: string | null;
  cover_image_url?: string | null;
  category: string;
  download_count: number;
};

const TYPE_BADGE: Record<ContentType, string> = {
  pdf: "Free Download",
  ebook: "Free Ebook",
  youtube: "Free Video",
  url: "Free Access",
  file: "Free Download",
};

function TypeIcon({ type, size = 12 }: { type: ContentType; size?: number }) {
  if (type === "youtube") return <Play size={size} className="text-[#E8192C]" />;
  if (type === "url") return <LinkIcon size={size} className="text-[#E8192C]" />;
  return <Download size={size} className="text-[#E8192C]" />;
}

type FetchState =
  | { status: "loading" }
  | { status: "ready"; magnet: Magnet }
  | { status: "missing" }
  | { status: "error"; message: string };

export default function FreeLeadMagnetPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [fetchState, setFetchState] = useState<FetchState>({
    status: "loading",
  });

  const utmSource = searchParams.get("utm_source") || "direct";
  const utmCampaign = searchParams.get("utm_campaign") || "";
  const utmContent = searchParams.get("utm_content") || "";

  useEffect(() => {
    if (!slug) {
      setFetchState({ status: "missing" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/lead-magnet?slug=${encodeURIComponent(slug)}`,
          {
            credentials: "include",
          },
        );
        if (cancelled) return;
        if (res.status === 404) {
          setFetchState({ status: "missing" });
          return;
        }
        if (!res.ok) {
          setFetchState({
            status: "error",
            message: `Couldn't load the offer (HTTP ${res.status})`,
          });
          return;
        }
        const magnet = (await res.json()) as Magnet;
        setFetchState({ status: "ready", magnet });
      } catch (err) {
        if (cancelled) return;
        setFetchState({
          status: "error",
          message:
            err instanceof Error
              ? err.message
              : "Network error fetching the offer.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (fetchState.status === "missing") {
    return <Navigate to="/" replace />;
  }

  if (fetchState.status === "error") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="font-['DM_Mono'] text-[11px] tracking-[0.3em] text-[#E8192C] mb-3">
            — SOMETHING WENT WRONG
          </p>
          <h1 className="font-['Bebas_Neue'] text-3xl text-white mb-3">
            We couldn&apos;t load this offer.
          </h1>
          <p className="font-['DM_Sans'] text-white/50 text-sm">
            {fetchState.message}
          </p>
        </div>
      </div>
    );
  }

  if (fetchState.status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#E8192C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { magnet } = fetchState;
  const contentType: ContentType = magnet.type || "pdf";
  const badgeLabel = TYPE_BADGE[contentType];

  return (
    <>
      <title>{`${magnet.title} | BigRonJones`}</title>
      <meta name="description" content={magnet.description} />
      <meta property="og:title" content={magnet.title} />
      <meta property="og:description" content={magnet.description} />
      <meta
        property="og:image"
        content={magnet.cover_image_url || "/assets/og-default.jpg"}
      />

      <div className="min-h-screen bg-[#050505]">
        <div className="bg-[#E8192C] py-2 text-center">
          <p className="font-['DM_Mono'] text-[10px] tracking-[0.3em] text-white uppercase">
            <BrandName variant="upper" /> &mdash; Practical Advice For Your Real
            World Goals
          </p>
        </div>

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center min-h-[calc(100vh-40px)]">
          {/* LEFT — Offer details */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-[#E8192C]/15 border border-[#E8192C]/30 px-4 py-2 mb-8"
            >
              <TypeIcon type={contentType} />
              <span className="font-['DM_Mono'] text-[10px] tracking-[0.25em] text-[#E8192C] uppercase">
                {badgeLabel}
              </span>
            </motion.div>

            <div className="overflow-hidden mb-2">
              <motion.h1
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.85,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="font-['Bebas_Neue'] text-white leading-[0.9]"
                style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
              >
                {magnet.title}
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="font-['DM_Sans'] text-white/60 text-base leading-relaxed mb-10 max-w-md"
            >
              {magnet.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-6 mb-10"
            >
              {[
                {
                  icon: Users,
                  text: `${(magnet.download_count || 0) + 847}+ downloaded`,
                },
                { icon: Star, text: "4.9/5 from real clients" },
                { icon: Clock, text: "7-minute read" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={13} className="text-[#E8192C]" />
                  <span className="font-['DM_Sans'] text-sm text-white/50">
                    {text}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="border-l-2 border-[#E8192C] pl-5"
            >
              <p className="font-['DM_Sans'] italic text-white/60 text-sm leading-relaxed">
                &ldquo;I built this because I was tired of seeing men over 35
                getting bad advice. This is the exact same framework I use with
                my 2,000+ clients.&rdquo;
              </p>
              <p className="font-['DM_Mono'] text-[10px] tracking-[0.2em] text-[#E8192C] mt-2">
                &mdash; <BrandName variant="upper" />
              </p>
            </motion.div>
          </div>

          {/* RIGHT — Lead capture form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0d0d0d] border border-[#1c1c1c] p-5 sm:p-6 md:p-8 lg:p-10 w-full"
          >
            <div className="mb-6">
              <div className="w-8 h-[2px] bg-[#E8192C] mb-4" />
              <h2 className="font-['Bebas_Neue'] text-2xl sm:text-3xl text-white leading-tight mb-2">
                {magnet.cta_text?.toUpperCase() || "GET INSTANT ACCESS"}
              </h2>
              <p className="font-['DM_Sans'] text-white/50 text-sm">
                Enter your details below.{" "}
                {contentType === "youtube"
                  ? "The video link arrives in your inbox in under 2 minutes."
                  : contentType === "url"
                    ? "Access details land in your inbox in under 2 minutes."
                    : "The guide lands in your inbox in under 2 minutes."}
              </p>
            </div>

            <LeadCaptureForm
              magnetSlug={magnet.slug}
              magnetTitle={magnet.title}
              utmSource={utmSource}
              utmCampaign={utmCampaign}
              utmContent={utmContent}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
