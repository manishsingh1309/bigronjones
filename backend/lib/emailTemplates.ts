// HTML email templates with consistent BigRonJones branding.
// Server-only — uses no React/JSX, safe to inline into Resend payloads.

const BASE_STYLE = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #050505;
  color: #ffffff;
  margin: 0;
  padding: 0;
`;

const CONTAINER = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #0d0d0d;
`;

function emailWrapper(content: string, unsubscribeUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
</head>
<body style="${BASE_STYLE}">
  <div style="${CONTAINER}">
    <div style="background:#E8192C; padding: 20px 40px;">
      <p style="margin:0; font-size:11px; letter-spacing:0.3em; color:white; font-weight:700;">
        BIGRONJONES
      </p>
    </div>

    ${content}

    <div style="padding: 30px 40px; border-top: 1px solid #1c1c1c;">
      <p style="margin:0 0 8px; font-size:12px; color:#555; line-height:1.6;">
        BigRonJones — Practical Advice For Your Real World Goals
      </p>
      <p style="margin:0; font-size:11px; color:#333;">
        <a href="https://bigronjones.com" style="color:#E8192C; text-decoration:none;">bigronjones.com</a>
        &nbsp;|&nbsp;
        <a href="${unsubscribeUrl}" style="color:#555; text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function pdfDeliveryEmail(opts: {
  firstName: string;
  magnetTitle: string;
  pdfUrl: string;
  unsubscribeUrl: string;
}): string {
  // Kept for backwards compatibility with the older sequence/cron path.
  return contentDeliveryEmail({
    firstName: opts.firstName,
    contentTitle: opts.magnetTitle,
    contentType: "pdf",
    deliveryUrl: opts.pdfUrl,
    unsubscribeUrl: opts.unsubscribeUrl,
  });
}

export type ContentType = "pdf" | "ebook" | "youtube" | "url" | "file";

const COPY_BY_TYPE: Record<
  ContentType,
  { label: string; cta: string; preamble: string }
> = {
  pdf: {
    label: "FREE GUIDE",
    cta: "DOWNLOAD YOUR FREE GUIDE",
    preamble:
      "Click below to download your guide. It's yours — no strings attached.",
  },
  ebook: {
    label: "FREE EBOOK",
    cta: "DOWNLOAD YOUR FREE EBOOK",
    preamble:
      "Click below to grab the ebook. It's yours — no strings attached.",
  },
  youtube: {
    label: "FREE VIDEO",
    cta: "WATCH THE VIDEO",
    preamble:
      "Click below to start watching. Carve out a quiet ten minutes — no distractions.",
  },
  url: {
    label: "FREE ACCESS",
    cta: "GET INSTANT ACCESS",
    preamble: "Click below to access what you signed up for.",
  },
  file: {
    label: "FREE DOWNLOAD",
    cta: "DOWNLOAD YOUR FILE",
    preamble: "Click below to download. It's yours.",
  },
};

export function contentDeliveryEmail(opts: {
  firstName: string;
  contentTitle: string;
  contentType: ContentType;
  deliveryUrl: string;
  unsubscribeUrl: string;
}): string {
  const { firstName, contentTitle, contentType, deliveryUrl, unsubscribeUrl } =
    opts;
  const copy = COPY_BY_TYPE[contentType] || COPY_BY_TYPE.pdf;

  const content = `
    <div style="padding: 40px 40px 20px;">
      <h1 style="margin:0 0 8px; font-size:32px; font-weight:900; letter-spacing:0.05em; color:#ffffff; line-height:1;">
        IT'S HERE, ${firstName.toUpperCase()}.
      </h1>
      <p style="margin:0 0 24px; font-size:11px; letter-spacing:0.25em; color:#E8192C; font-weight:700;">
        ${copy.label} &mdash; ${contentTitle.toUpperCase()}
      </p>

      <p style="margin:0 0 20px; font-size:15px; color:#999; line-height:1.7;">
        No fluff. No gimmicks. Just the exact framework that's helped
        2,000+ real people build real results.
      </p>

      <p style="margin:0 0 32px; font-size:15px; color:#999; line-height:1.7;">
        ${copy.preamble}
      </p>

      <a href="${deliveryUrl}"
        style="display:inline-block; background:#E8192C; color:#ffffff; padding:16px 36px;
               font-size:13px; font-weight:700; letter-spacing:0.15em; text-decoration:none;
               text-transform:uppercase; margin-bottom:32px;">
        ${copy.cta} &rarr;
      </a>

      <div style="border-left:3px solid #E8192C; padding-left:20px; margin-bottom:32px;">
        <p style="margin:0; font-size:14px; color:#ccc; font-style:italic; line-height:1.7;">
          "No perfect life required. Show up, stay consistent, and the progress follows."
        </p>
        <p style="margin:8px 0 0; font-size:12px; color:#555; font-weight:700; letter-spacing:0.15em;">
          &mdash; BIG RON JONES
        </p>
      </div>

      <p style="margin:0; font-size:14px; color:#555; line-height:1.7;">
        Watch your inbox &mdash; I'll share more practical advice built specifically
        for adults ready to build real structure.
        <br/><br/>
        &mdash; Ron
      </p>
    </div>
  `;
  return emailWrapper(content, unsubscribeUrl);
}

export function nurtureEmail(opts: {
  firstName: string;
  subject: string;
  bodyParagraphs: string[];
  ctaText: string;
  ctaUrl: string;
  dayNumber: number;
  unsubscribeUrl: string;
}): string {
  const { firstName, subject, bodyParagraphs, ctaText, ctaUrl, dayNumber, unsubscribeUrl } = opts;
  const paragraphs = bodyParagraphs
    .map(
      (p) =>
        `<p style="margin:0 0 20px; font-size:15px; color:#999; line-height:1.8;">${p}</p>`
    )
    .join("");

  const content = `
    <div style="padding: 40px 40px 20px;">
      <p style="margin:0 0 24px; font-size:11px; letter-spacing:0.25em; color:#E8192C; font-weight:700;">
        DAY ${dayNumber} &mdash; BIG RON JONES
      </p>

      <h2 style="margin:0 0 24px; font-size:26px; font-weight:900; color:#ffffff; line-height:1.1;">
        ${subject}
      </h2>

      <p style="margin:0 0 20px; font-size:15px; color:#aaa; line-height:1.8;">
        ${firstName},
      </p>

      ${paragraphs}

      <a href="${ctaUrl}"
        style="display:inline-block; background:#E8192C; color:#ffffff; padding:16px 36px;
               font-size:13px; font-weight:700; letter-spacing:0.15em; text-decoration:none;
               text-transform:uppercase; margin:12px 0 32px;">
        ${ctaText} &rarr;
      </a>

      <p style="margin:0; font-size:13px; color:#444; line-height:1.7;">
        &mdash; Ron<br/>
        <span style="color:#333; font-size:11px; letter-spacing:0.15em;">BIGRONJONES.COM</span>
      </p>
    </div>
  `;
  return emailWrapper(content, unsubscribeUrl);
}
