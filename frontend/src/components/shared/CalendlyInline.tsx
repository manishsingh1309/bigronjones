import { useEffect, useMemo, useState } from "react";

// Direct iframe Calendly embed. We previously used Calendly's widget.js +
// initInlineWidget JS API, but that approach was flaky in our setup: the iframe
// would render the event header ("Select a Date & Time") and then hang before
// the availability grid loaded. Plain iframe is what Calendly recommends as the
// most reliable embed surface; prefill rides on URL params instead of the JS
// API.

type Props = {
  url: string;
  prefill?: { name?: string | null; email?: string | null };
  className?: string;
  height?: number;
};

export default function CalendlyInline({
  url,
  prefill,
  className,
  height = 1100,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  const embedUrl = useMemo(() => {
    try {
      const u = new URL(url);
      // Strip noisy view-state params (e.g. ?month=2026-05 that Calendly adds
      // when you copy the URL from your own calendar UI).
      u.searchParams.delete("month");
      u.searchParams.set("primary_color", "e8192c");
      u.searchParams.set("hide_gdpr_banner", "1");
      if (typeof window !== "undefined") {
        u.searchParams.set("embed_domain", window.location.hostname);
        u.searchParams.set("embed_type", "Inline");
      }
      const name = prefill?.name?.trim();
      const email = prefill?.email?.trim();
      if (name) u.searchParams.set("name", name);
      if (email) u.searchParams.set("email", email);
      return u.toString();
    } catch {
      return url;
    }
  }, [url, prefill?.name, prefill?.email]);

  useEffect(() => {
    setLoaded(false);
  }, [embedUrl]);

  return (
    <div
      className={className}
      style={{ position: "relative", minWidth: 320, minHeight: height }}
    >
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-white"
          style={{ minHeight: height }}
        >
          <div className="flex flex-col items-center gap-3 text-[#050505]/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8192C] border-t-transparent" />
            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em]">
              Loading calendar…
            </p>
          </div>
        </div>
      )}
      <iframe
        key={embedUrl}
        src={embedUrl}
        title="Schedule with Calendly"
        width="100%"
        height={height}
        onLoad={() => setLoaded(true)}
        style={{
          minWidth: 320,
          border: 0,
          display: "block",
          background: "#ffffff",
        }}
      />
    </div>
  );
}
