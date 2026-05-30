// Server-only mailer. Sends transactional emails through Gmail SMTP using a
// Google App Password. NEVER import this from frontend/ — SMTP_PASS would leak.
//
// Configuration (.env):
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=ron@bigronjones.com
//   SMTP_PASS=<gmail app password, no spaces>
//   SMTP_FROM_NAME=Big Ron Jones
import dns from "node:dns/promises";
import net from "node:net";
import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;
let initPromise: Promise<Transporter> | null = null;

/** Resolve SMTP host to IPv4 only (Render/Vercel often have no IPv6 route to Gmail). */
async function resolveSmtpIPv4(hostname: string): Promise<string> {
  if (net.isIP(hostname)) return hostname;
  const addresses = await dns.resolve4(hostname);
  if (!addresses.length) {
    throw new Error(`No IPv4 address found for SMTP host: ${hostname}`);
  }
  return addresses[0];
}

async function getTransporter(): Promise<Transporter> {
  if (cached) return cached;
  if (!initPromise) {
    initPromise = createTransporter().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

async function createTransporter(): Promise<Transporter> {
  const hostname = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!hostname || !user || !pass) {
    throw new Error(
      "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env."
    );
  }

  // Nodemailer 8 picks a random A/AAAA record; IPv6 often fails with ENETUNREACH on cloud hosts.
  const connectHost = await resolveSmtpIPv4(hostname);

  cached = nodemailer.createTransport({
    host: connectHost,
    port,
    secure: port === 465,
    auth: { user, pass },
    servername: hostname,
    tls: { servername: hostname },
  });
  return cached;
}

export type SendEmailInput = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
};

export type SendEmailResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const fromName = process.env.SMTP_FROM_NAME || "Big Ron Jones";
  const fromEmail = process.env.SMTP_USER!;
  const toAddress = input.toName
    ? `"${input.toName.replace(/"/g, "")}" <${input.to}>`
    : input.to;

  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toAddress,
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: input.headers,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    // Log error only — never log credentials, never log full transport options.
    console.error("[mailer] send failed:", message);
    return { success: false, error: message };
  }
}

export function isMailerConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}
