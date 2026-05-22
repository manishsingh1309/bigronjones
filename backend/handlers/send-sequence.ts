// GET /api/send-sequence
//
// Cron-protected. Run daily (e.g. via Vercel Cron) to send the next email in
// each lead's nurture sequence. Picks up at most 100 due leads per invocation.
//
// curl -H "Authorization: Bearer $CRON_SECRET" https://bigronjones.com/api/send-sequence
import { Resend } from "resend";
import { createServerSupabase } from "../lib/supabase";
import { nurtureEmail } from "../lib/emailTemplates";


type LeadRow = {
  id: string;
  email: string;
  full_name: string;
  lead_magnet_id: string;
  lead_magnet_slug: string;
  sequence_day: number | null;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Auth check — must be Bearer CRON_SECRET. Vercel Cron sets this header
  // automatically when you configure CRON_SECRET in env vars.
  const authHeader = req.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;
  const siteUrl = process.env.SITE_URL || "https://bigronjones.com";
  const now = new Date().toISOString();

  // Find leads due for their next email.
  const { data: dueLeads, error } = await supabase
    .from("leads")
    .select("id, email, full_name, lead_magnet_id, lead_magnet_slug, sequence_day")
    .lte("next_email_due_at", now)
    .eq("sequence_paused", false)
    .eq("status", "new")
    .limit(100);

  if (error) {
    console.error("[send-sequence] failed to fetch due leads:", error);
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  const results: string[] = [];

  for (const lead of (dueLeads || []) as LeadRow[]) {
    const nextDay = (lead.sequence_day || 0) + 1;

    // Look up the next email in this magnet's sequence.
    const { data: sequenceEmail } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("lead_magnet_id", lead.lead_magnet_id)
      .eq("day_number", nextDay)
      .eq("active", true)
      .maybeSingle();

    if (!sequenceEmail) {
      // Sequence is exhausted — pause this lead so we don't keep checking it.
      await supabase
        .from("leads")
        .update({
          sequence_paused: true,
          status: "contacted",
          updated_at: now,
        })
        .eq("id", lead.id);
      results.push(`- ${lead.email} (sequence complete, paused)`);
      continue;
    }

    const firstName = lead.full_name.split(" ")[0] || lead.full_name;
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(lead.email)}&magnet=${encodeURIComponent(lead.lead_magnet_slug)}`;

    // body_html is stored with `||` as the paragraph delimiter so each
    // sequence row holds plain prose without nested HTML escaping.
    const bodyParagraphs = (sequenceEmail.body_html || "")
      .split("||")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const html = nurtureEmail({
      firstName,
      subject: sequenceEmail.subject,
      bodyParagraphs,
      ctaText: sequenceEmail.cta_text || "Book a Call with Ron",
      ctaUrl: sequenceEmail.cta_url || `${siteUrl}/shop/private-coaching-call`,
      dayNumber: nextDay,
      unsubscribeUrl,
    });

    try {
      if (resend) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "ron@bigronjones.com",
          to: lead.email,
          subject: sequenceEmail.subject,
          html,
          text: sequenceEmail.body_text || bodyParagraphs.join("\n\n"),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
      } else {
        console.log(
          `[send-sequence][DEV] Day ${nextDay} → ${lead.email}: ${sequenceEmail.subject}`
        );
      }

      // Cadence: daily for the first 3 days, every 2 days through day 7,
      // every 3 days thereafter. Tweak in one place if needed.
      const daysUntilNext = nextDay < 3 ? 1 : nextDay < 7 ? 2 : 3;
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + daysUntilNext);
      nextDue.setHours(9, 0, 0, 0);

      await supabase
        .from("leads")
        .update({
          sequence_day: nextDay,
          last_email_sent_at: now,
          next_email_due_at: nextDue.toISOString(),
          updated_at: now,
        })
        .eq("id", lead.id);

      sent++;
      results.push(`+ ${lead.email} (Day ${nextDay})`);
    } catch (err) {
      failed++;
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`[send-sequence] send failed for ${lead.email}:`, err);
      results.push(`x ${lead.email}: ${detail}`);
    }
  }

  return Response.json({
    success: true,
    processed: (dueLeads || []).length,
    sent,
    failed,
    results,
    timestamp: now,
  });
}
