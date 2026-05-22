import { escape, sendEmail } from "../lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_PROGRAMS = new Set(["mens", "womens", "trial"]);


export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: Record<string, string>;
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const program = (body.program || "").trim().toLowerCase();
  const name = (body.name || "").trim().slice(0, 120);
  const email = (body.email || "").trim().toLowerCase().slice(0, 200);
  const phone = (body.phone || "").trim().slice(0, 40);
  const goals = (body.goals || "").trim().slice(0, 2000);
  const experience = (body.experience || "").trim().slice(0, 60);
  const commitment = (body.commitment || "").trim().slice(0, 60);

  if (!ALLOWED_PROGRAMS.has(program))
    return Response.json({ error: "Pick a program" }, { status: 400 });
  if (!name) return Response.json({ error: "Name required" }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return Response.json({ error: "Valid email required" }, { status: 400 });
  if (goals.length < 20)
    return Response.json(
      { error: "Tell us about your goals — at least 20 characters." },
      { status: 400 }
    );

  const inbox = process.env.CONTACT_INBOX_EMAIL || "hello@bigronjones.com";

  await sendEmail({
    to: inbox,
    subject: `[Application] ${program.toUpperCase()} — ${name}`,
    replyTo: email,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:600px;">
        <h2>New ${escape(program)} program application</h2>
        <p><strong>Name:</strong> ${escape(name)}</p>
        <p><strong>Email:</strong> <a href="mailto:${escape(email)}">${escape(email)}</a></p>
        ${phone ? `<p><strong>Phone:</strong> ${escape(phone)}</p>` : ""}
        ${experience ? `<p><strong>Experience:</strong> ${escape(experience)}</p>` : ""}
        ${commitment ? `<p><strong>Commitment level:</strong> ${escape(commitment)}</p>` : ""}
        <h3 style="margin-top:18px;">Goals</h3>
        <p style="white-space:pre-wrap;line-height:1.55;">${escape(goals)}</p>
      </div>
    `,
  });

  await sendEmail({
    to: email,
    subject: "Application received — Big Ron will review personally",
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;padding:32px;background:#0a0a0a;color:#f5f5f5;">
        <p style="font-family:'Bebas Neue',Impact,sans-serif;font-size:36px;letter-spacing:0.04em;margin:0 0 12px;color:#fff;">APPLICATION IN.</p>
        <p style="font-size:16px;line-height:1.55;color:#cfcfcf;">Hey ${escape(name)} — Ron and the team will review your application within 48 hours and reach out directly.</p>
        <p style="font-size:16px;line-height:1.55;color:#cfcfcf;">Talk soon. — Big Ron</p>
      </div>
    `,
  });

  return Response.json({ ok: true });
}
