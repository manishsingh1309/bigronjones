
import { siteData } from "@/data/site";

export default function MarqueeBand() {
  const items = [...siteData.marquee, ...siteData.marquee];

  return (
    <section
      aria-label="Brand marquee"
      className="marquee-pause relative overflow-hidden border-y border-[#b50f1f]/30 bg-[#E8192C] py-3"
    >
      <div className="marquee-track flex w-max items-center gap-6 whitespace-nowrap">
        {items.map((text, i) => (
          <span key={i} className="flex items-center gap-6">
            <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-white">
              {text}
            </span>
            <span className="text-white/40" aria-hidden>
              ◆
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
