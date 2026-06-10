import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * Email transport. Two backends:
 *
 *  1. Gmail SMTP (nodemailer) — PREFERRED when GMAIL_USER + GMAIL_APP_PASSWORD
 *     are set. Unlike Resend on an unverified domain, Gmail delivers to ANY
 *     recipient, which makes it the right choice for localhost demos. Requires
 *     a Google account with 2FA + an App Password (not the normal password).
 *
 *  2. Resend (official SDK) — used when Gmail is not configured. Typed
 *     responses + future features (audiences, batch). On an unverified domain
 *     Resend only delivers to the account owner, so the DEV_REDIRECT_TO escape
 *     hatch below routes everything there for testing.
 *
 * If neither is configured we no-op and log — never throw — so forms still
 * acknowledge the user during pre-launch / preview deploys.
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Big Ron Jones <hello@bigronjones.com>";

// Gmail SMTP transport. App Passwords are displayed grouped with spaces
// ("abcd efgh ijkl mnop") — strip them so a copy-paste with spaces still works.
const GMAIL_USER = process.env.GMAIL_USER?.trim();
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const gmailTransport =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      })
    : null;
// Gmail rewrites the envelope sender to the authenticated account, but a
// display name is preserved — so the inbox still reads "Big Ron Jones".
const GMAIL_FROM = `${process.env.GMAIL_FROM_NAME || "Big Ron Jones"} <${GMAIL_USER}>`;

// Dev/demo only, Resend path. When set, every Resend send is redirected to this
// address regardless of the real recipient — needed because Resend only
// delivers to the account owner until a domain is verified at
// resend.com/domains. Ignored entirely when Gmail SMTP is active (Gmail
// delivers to the real recipient). Leave UNSET in production.
const DEV_REDIRECT_TO = process.env.RESEND_DEV_REDIRECT_TO?.trim();

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  // Optional file attachments. `path` may be a remote URL (both nodemailer and
  // Resend fetch it) — used to attach the lead-magnet PDF directly to the email.
  attachments?: Array<{ filename: string; path: string }>;
};

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: "missing-key" | "send-failed"; detail?: string };

export async function sendEmail(input: SendEmailInput): Promise<EmailResult> {
  // Preferred path: Gmail SMTP. Delivers to the real recipient (no redirect).
  if (gmailTransport) {
    try {
      const info = await gmailTransport.sendMail({
        from: GMAIL_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: input.replyTo,
        headers: input.headers,
        attachments: input.attachments,
      });
      console.log(
        `[email] Sent via Gmail SMTP to ${
          Array.isArray(input.to) ? input.to.join(", ") : input.to
        } (id ${info.messageId})`
      );
      return { ok: true, id: info.messageId };
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[email] Gmail SMTP error:", detail);
      return { ok: false, reason: "send-failed", detail };
    }
  }

  if (!resend) {
    console.warn(
      "[email] No transport configured (GMAIL_* / RESEND_API_KEY) — email skipped. Subject:",
      input.subject
    );
    return { ok: false, reason: "missing-key" };
  }

  // In dev/demo mode, route every send to the account-owner inbox so the flow
  // works end-to-end without a verified domain. The intended recipient is kept
  // visible in the subject line so demos still read clearly.
  const realTo = Array.isArray(input.to) ? input.to.join(", ") : input.to;
  const to = DEV_REDIRECT_TO || input.to;
  const subject = DEV_REDIRECT_TO
    ? `[demo → ${realTo}] ${input.subject}`
    : input.subject;

  if (DEV_REDIRECT_TO) {
    console.log(
      `[email] DEV redirect active — sending "${input.subject}" for ${realTo} to ${DEV_REDIRECT_TO}`
    );
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    headers: input.headers,
    attachments: input.attachments,
  });

  if (error) {
    console.error("[email] Resend error:", error);
    return { ok: false, reason: "send-failed", detail: error.message };
  }
  return { ok: true, id: data?.id || "" };
}

/** Add an email to a Resend audience (newsletter list). No-op if config absent. */
export async function addToAudience(email: string, firstName?: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!resend || !audienceId) return { ok: false as const, reason: "no-config" };

  const { error } = await resend.contacts.create({
    email,
    firstName,
    unsubscribed: false,
    audienceId,
  });
  if (error) {
    // 409 (duplicate) isn't an error from the user's POV — they're already on the list.
    if (error.name === "validation_error") {
      return { ok: true as const, deduped: true };
    }
    return { ok: false as const, reason: "api-error", detail: error.message };
  }
  return { ok: true as const };
}

export function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
