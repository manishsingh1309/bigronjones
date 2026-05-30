// Retry email delivery for every lead row where pdf_sent = false.
// Sends through Resend the same way capture-lead does, so the result
// reflects production behavior.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const envPath = path.resolve(process.cwd(), ".env");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const sep = t.indexOf("=");
  if (sep === -1) continue;
  const k = t.slice(0, sep).trim();
  const v = t.slice(sep + 1).trim().replace(/^['"]|['"]$/g, "");
  if (k && process.env[k] === undefined) process.env[k] = v;
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: pending, error } = await sb
  .from("leads")
  .select("id, full_name, email, lead_magnet_id, lead_magnet_slug, pdf_sent, lead_magnets(title, type, pdf_url, external_url, email_subject)")
  .eq("pdf_sent", false);

if (error) {
  console.error("Failed to query leads:", error.message);
  process.exit(1);
}

console.log(`Found ${pending.length} pending lead(s) to retry`);
if (pending.length === 0) process.exit(0);

if (!process.env.RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set — cannot send. Aborting.");
  process.exit(1);
}
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail =
  process.env.RESEND_FROM_EMAIL || "Big Ron Jones <ron@bigronjones.com>";

const siteUrl = (process.env.SITE_URL || "https://bigronjones.com").replace(/\/$/, "");

for (const lead of pending) {
  const magnet = lead.lead_magnets;
  if (!magnet) {
    console.log(`  ✗ ${lead.email}: orphaned (no magnet)`);
    continue;
  }
  const deliveryUrlRaw = magnet.type === "youtube" || magnet.type === "url" ? magnet.external_url : magnet.pdf_url;
  if (!deliveryUrlRaw) {
    console.log(`  ✗ ${lead.email}: magnet has no delivery URL`);
    continue;
  }
  const deliveryUrl = deliveryUrlRaw.startsWith("http") ? deliveryUrlRaw : `${siteUrl}${deliveryUrlRaw}`;
  const firstName = lead.full_name.split(" ")[0] || lead.full_name;
  const subject = magnet.email_subject || `Your Free ${magnet.title} from BigRonJones`;
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(lead.email)}&magnet=${encodeURIComponent(lead.lead_magnet_slug)}`;

  const html = `<!DOCTYPE html><html><body style="background:#050505;color:#fff;font-family:Arial,sans-serif;margin:0;padding:0;">
<div style="max-width:600px;margin:0 auto;background:#0d0d0d;">
  <div style="background:#E8192C;padding:20px 40px;"><p style="margin:0;font-size:11px;letter-spacing:0.3em;color:white;font-weight:700;">BIGRONJONES</p></div>
  <div style="padding:40px;">
    <h1 style="margin:0 0 8px;font-size:32px;font-weight:900;color:#fff;">IT'S HERE, ${firstName.toUpperCase()}.</h1>
    <p style="margin:0 0 24px;font-size:11px;letter-spacing:0.25em;color:#E8192C;font-weight:700;">FREE ACCESS — ${magnet.title.toUpperCase()}</p>
    <p style="margin:0 0 32px;font-size:15px;color:#999;line-height:1.7;">Sorry for the delay — our mail system had a hiccup. Here's your content now.</p>
    <a href="${deliveryUrl}" style="display:inline-block;background:#E8192C;color:#fff;padding:16px 36px;font-size:13px;font-weight:700;letter-spacing:0.15em;text-decoration:none;text-transform:uppercase;">GET INSTANT ACCESS →</a>
    <p style="margin:32px 0 0;font-size:14px;color:#555;line-height:1.7;">— Ron</p>
  </div>
  <div style="padding:24px 40px;border-top:1px solid #1c1c1c;"><p style="margin:0;font-size:11px;color:#333;"><a href="${siteUrl}" style="color:#E8192C;text-decoration:none;">bigronjones.com</a> · <a href="${unsubscribeUrl}" style="color:#555;">Unsubscribe</a></p></div>
</div></body></html>`;

  try {
    const { data, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: lead.email,
      subject,
      html,
      text: `Hi ${firstName}, your content: ${deliveryUrl}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (sendError) throw new Error(sendError.message);
    console.log(`  ✓ ${lead.email}: sent (id=${data?.id || ""})`);
    await sb.from("leads").update({ pdf_sent: true, pdf_sent_at: new Date().toISOString(), email_error: null }).eq("id", lead.id);
  } catch (err) {
    console.log(`  ✗ ${lead.email}: ${err.message}`);
    await sb.from("leads").update({ email_error: err.message }).eq("id", lead.id);
  }
}

console.log("\nDone.");
