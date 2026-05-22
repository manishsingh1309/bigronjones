import { useEffect } from "react";

/**
 * Drop-in analytics. Renders nothing if VITE_GA_ID is unset, so
 * you can ship the same code to any environment.
 */
export default function Analytics() {
  const gaId = import.meta.env.VITE_GA_ID;

  useEffect(() => {
    if (!gaId) return;
    if (document.querySelector(`script[data-ga-id="${gaId}"]`)) return;

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    tag.dataset.gaId = gaId;
    document.head.appendChild(tag);

    const init = document.createElement("script");
    init.dataset.gaId = `${gaId}-init`;
    init.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', { anonymize_ip: true });
    `;
    document.head.appendChild(init);
  }, [gaId]);

  return null;
}
