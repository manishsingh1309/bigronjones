// Lightweight analytics helper. Forwards events to Google Analytics (gtag)
// when it's loaded (see components/analytics/Analytics.tsx). No-ops safely
// when gtag is absent (e.g. VITE_GA_ID unset, SSR, ad-blockers) so callers
// can fire events unconditionally without guarding every site.
type TrackParams = Record<string, unknown>;

export function track(event: string, params: TrackParams = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void })
    .gtag;
  if (typeof gtag === "function") {
    gtag("event", event, { event_category: "engagement", ...params });
  }
}
