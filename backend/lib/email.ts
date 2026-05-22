import { Resend } from "resend";

/**
 * Resend wrapper. Uses the official SDK so we get typed responses + future
 * features (audiences, batch, templates) without rewriting.
 *
 * If RESEND_API_KEY is missing we no-op and log — never throw — so contact
 * forms still acknowledge the user during pre-launch / preview deploys.
 */

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM =
  process.env.RESEND_FROM_EMAIL ||
  "Big Ron Jones <hello@bigronjones.com>";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: "missing-key" | "send-failed"; detail?: string };

export async function sendEmail(input: SendEmailInput): Promise<EmailResult> {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not set — email skipped. Subject:",
      input.subject
    );
    return { ok: false, reason: "missing-key" };
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
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
