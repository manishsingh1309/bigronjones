import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Music2, Facebook, Mail } from "lucide-react";
import { siteData } from "@/data/site";
import BrandName from "@/components/shared/BrandName";

const ICONS = { Instagram, Youtube, Music2, Facebook } as const;
type IconName = keyof typeof ICONS;

const sitemap: { heading: string; links: { label: string; href: string }[] }[] =
  [
    {
      heading: "Programs",
      links: [
        { label: "7-Day Trial", href: "/programs/trial" },
        { label: "Men's Alliance", href: "/programs/mens" },
        { label: "Women's Wellness", href: "/programs/womens" },
        { label: "All Programs", href: "/programs" },
      ],
    },
    {
      heading: "Services",
      links: [
        { label: "Private Coaching Call", href: "/shop/private-coaching-call" },
        {
          label: "Nutrition Consultation",
          href: "/shop/private-nutrition-call",
        },
        { label: "Pediatrics Program", href: "/shop/pediatrics-program" },
        { label: "Band Workout", href: "/shop/band-powered-workout" },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About Ron", href: "/about" },
        { label: "Meet the Team", href: "/team" },
        { label: "Testimonials", href: "/testimonials" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Refunds", href: "/refund" },
  { label: "Shipping", href: "/shipping-policy" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      if (!res.ok) throw new Error();
      setState("success");
      setEmail("");
      setTimeout(() => setState("idle"), 4000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <footer className="relative overflow-hidden border-t border-[#E8192C] bg-[#050505] pt-20 pb-10">
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-0 right-0 select-none whitespace-nowrap text-center font-['Bebas_Neue'] leading-none text-white/[0.025]"
        style={{
          fontSize: "clamp(4rem, 16vw, 18rem)",
          letterSpacing: "0.02em",
        }}
      >
        BIGRONJONES
      </span>

      <div className="relative z-[2] mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Top: brand + tagline + socials */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-[#1a1a1a] pb-10 md:flex-row md:items-center">
          <div className="flex flex-col gap-3">
            <Link to="/" className="inline-flex items-center">
              <span
                className="select-none leading-none text-white"
                style={{
                  fontFamily:
                    "'TT Bluescreens', 'Barlow Condensed', 'Bebas Neue', sans-serif",
                  fontWeight: 800,
                  fontSize: "30px",
                  letterSpacing: "0.12em",
                  color: "#FFFFFF",
                }}
              >
                <BrandName variant="upper" />
              </span>
            </Link>
            <p className="font-['DM_Sans'] text-sm italic text-white/60">
              Practical Advice For Your Real World Goals.
            </p>
            <a
              href={`mailto:${siteData.contact.email}`}
              className="mt-1 inline-flex items-center gap-2 font-['DM_Sans'] text-sm text-white/55 hover:text-[#E8192C]"
            >
              <Mail size={14} /> {siteData.contact.email}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {siteData.social.map((s) => {
              const Icon = ICONS[s.icon as IconName] ?? Instagram;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center border border-[#1a1a1a] text-white/70 transition-colors hover:border-[#E8192C] hover:text-white"
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Sitemap grid */}
        <div className="grid grid-cols-2 gap-10 border-b border-[#1a1a1a] py-12 md:grid-cols-4 md:gap-6">
          <div className="col-span-2 md:col-span-1">
            <h3 className="mb-5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
              — Stay In Ron&apos;s Loop
            </h3>
            <p className="mb-4 font-['DM_Sans'] text-sm leading-relaxed text-white/55">
              3 fresh posts every morning. No spam. Unsubscribe in one click.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state === "loading" || state === "success"}
                placeholder="you@email.com"
                aria-label="Email address"
                className="border border-[#1a1a1a] bg-[#0f0f0f] px-3 py-2.5 font-['DM_Sans'] text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#E8192C] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={state === "loading" || state === "success"}
                className="inline-flex items-center justify-center bg-[#E8192C] px-5 py-2.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f] disabled:opacity-70"
              >
                {state === "loading"
                  ? "Joining..."
                  : state === "success"
                    ? "✓ You're In"
                    : state === "error"
                      ? "Try Again"
                      : "Join Free"}
              </button>
            </form>
            <Link
              to="/programs/trial"
              className="mt-5 inline-flex items-center bg-transparent border border-[#E8192C]/40 px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.15em] text-white/80 transition-colors hover:border-[#E8192C] hover:text-white"
            >
              Or Start the 7-Day Trial →
            </Link>
          </div>

          {sitemap.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
                — {col.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      to={l.href}
                      className="font-['DM_Sans'] text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: legal */}
        <div className="flex flex-col items-start justify-between gap-4 pt-8 text-white/40 md:flex-row md:items-center">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} <BrandName variant="upper" /> LLC.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="font-['DM_Sans'] text-[13px] italic">
            No contracts. No gimmicks. Just results.
          </p>
        </div>
      </div>
    </footer>
  );
}
