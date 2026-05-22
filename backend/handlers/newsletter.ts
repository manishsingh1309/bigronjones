import { addToAudience, escape, sendEmail } from "../lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { email?: string; firstName?: string; source?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const firstName = (body.firstName || "").trim().slice(0, 80) || undefined;
  const source = (body.source || "site").trim().slice(0, 60);

  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  const audience = await addToAudience(email, firstName);
  await sendEmail({
    to: email,
    subject: "You're in. Welcome to Big Ron's list.",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#0a0a0a;color:#f5f5f5;">
        <p style="font-family:'Bebas Neue',Impact,sans-serif;font-size:36px;letter-spacing:0.04em;margin:0 0 12px;color:#fff;">YOU'RE IN.</p>
        <p style="font-size:16px;line-height:1.55;color:#cfcfcf;margin:0 0 16px;">
          Hey${firstName ? ` ${escape(firstName)}` : ""} — Ron here. Welcome to the list.
        </p>
        <p style="font-size:16px;line-height:1.55;color:#cfcfcf;margin:0 0 16px;">
          Three new posts go out every morning at 6 AM. Direct to your inbox. No fluff. No upsells. Just what works.
        </p>
        <p style="font-size:16px;line-height:1.55;color:#cfcfcf;margin:0 0 28px;">
          Reply to this email if you ever want to talk programs, nutrition, or just say what's on your mind.
        </p>
        <a href="https://bigronjones.com/programs" style="display:inline-block;background:#E8192C;color:#fff;text-decoration:none;padding:14px 22px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Explore the Programs</a>
        <p style="font-size:12px;color:#666;margin:32px 0 0;">— Big Ron</p>
      </div>
    `,
  });

  console.log(`[subscribe] ${email} via ${source} (audience: ${audience.ok ? "ok" : "skipped"})`);

  return Response.json({ ok: true });
}
