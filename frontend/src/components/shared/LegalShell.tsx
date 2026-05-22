import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface Props {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalShell({
  eyebrow,
  title,
  lastUpdated,
  children,
}: Props) {
  return (
    <article className="bg-[#050505] pt-28 pb-24 md:pt-36 md:pb-32">
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white"
        >
          <ChevronLeft size={14} />
          Back home
        </Link>

        <p className="mt-8 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
          — {eyebrow}
        </p>
        <h1
          className="mt-3 font-['Bebas_Neue'] leading-[0.95] text-white"
          style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
        >
          {title}
        </h1>
        <p className="mt-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.22em] text-white/40">
          Last updated: {lastUpdated}
        </p>

        <div className="prose prose-invert mt-10 max-w-none font-['DM_Sans'] text-[15px] leading-[1.75] text-white/75 [&_a]:text-[#E8192C] [&_a]:no-underline hover:[&_a]:underline [&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:font-['Bebas_Neue'] [&_h2]:text-2xl [&_h2]:tracking-wide [&_h2]:text-white [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:font-['DM_Sans'] [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_p]:mb-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1.5">
          {children}
        </div>

        <div className="mt-16 border-t border-[#1a1a1a] pt-6">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white/40">
            Questions? Email{" "}
            <a
              href="mailto:hello@bigronjones.com"
              className="text-[#E8192C] hover:text-white"
            >
              hello@bigronjones.com
            </a>
          </p>
        </div>
      </div>
    </article>
  );
}
