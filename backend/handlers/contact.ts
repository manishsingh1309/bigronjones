import { escape, sendEmail } from "../lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: {
    name?: string;
    email?: string;
    message?: string;
    topic?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 120);
  const email = (body.email || "").trim().toLowerCase().slice(0, 200);
  const message = (body.message || "").trim().slice(0, 4000);
  const topic = (body.topic || "General").trim().slice(0, 80);

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return Response.json({ error: "Valid email required" }, { status: 400 });
  if (message.length < 10)
    return Response.json(
      { error: "Tell us a bit more — at least 10 characters." },
      { status: 400 }
    );

  const inbox = process.env.CONTACT_INBOX_EMAIL || "hello@bigronjones.com";

  const result = await sendEmail({
    to: inbox,
    subject: `[Site] ${topic} — ${name}`,
    replyTo: email,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;">
        <h2 style="margin:0 0 12px;">New ${escape(topic)} message</h2>
        <p style="margin:0 0 6px;"><strong>From:</strong> ${escape(name)} &lt;${escape(email)}&gt;</p>
        <p style="margin:0 0 16px;color:#666;font-size:13px;">Reply directly to this email — replies will go to the sender.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
        <p style="white-space:pre-wrap;line-height:1.55;">${escape(message)}</p>
      </div>
    `,
  });

  if (!result.ok) {
    if (result.reason === "missing-key") {
      console.warn(`[contact] queued without sending (no Resend key): ${email}`);
      return Response.json({ ok: true, queued: true });
    }
    return Response.json(
      { error: "Could not send right now. Please try again or email hello@bigronjones.com." },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
}
