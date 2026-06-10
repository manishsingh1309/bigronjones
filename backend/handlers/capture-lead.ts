// POST /api/capture-lead
//
// Critical path. The contract:
//   1. Validate input.
//   2. Save the lead to Supabase BEFORE attempting email send — if email
//      fails the lead is still in the DB and can be retried.
//   3. Send the delivery email via Resend.
//   4. Mark pdf_sent only if the send confirmed.
//   5. Always return success to the user as long as the lead is saved.
//      (Retries can be triggered manually from the leads table.)
//
// Multi-type aware: the lead_magnets row carries a `type` (pdf | ebook |
// youtube | url | file). The delivery URL is `pdf_url` for uploaded files
// or `external_url` for YouTube/links. The email template adapts copy and
// CTA wording to the type.
import { createServerSupabase } from "../lib/supabase";
import {
  contentDeliveryEmail,
  type ContentType,
} from "../lib/emailTemplates";
import { sendEmail } from "../lib/email";
import {
  LeadContextSchema,
  LeadFormSchema,
} from "../../shared/lib/leadSchemas";


const ALLOWED_TYPES: ContentType[] = ["pdf", "ebook", "youtube", "url", "file"];

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  // 1. Parse + validate
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid request format" },
      { status: 400 }
    );
  }

  const formParse = LeadFormSchema.safeParse(raw);
  if (!formParse.success) {
    const firstError =
      formParse.error.issues[0]?.message || "Validation failed";
    return Response.json(
      { success: false, error: firstError },
      { status: 422 }
    );
  }
  const ctxParse = LeadContextSchema.safeParse(raw);
  if (!ctxParse.success) {
    return Response.json(
      { success: false, error: "Missing lead magnet" },
      { status: 400 }
    );
  }

  const { full_name, email, phone } = formParse.data;
  const {
    lead_magnet_slug,
    utm_source = "website",
    utm_campaign = "",
    utm_content = "",
    referrer_url = "",
  } = ctxParse.data;

  const supabase = createServerSupabase();

  // 2. Look up the magnet (also confirms the slug is active).
  const { data: magnet, error: magnetError } = await supabase
    .from("lead_magnets")
    .select("*")
    .eq("slug", lead_magnet_slug)
    .eq("active", true)
    .single();

  if (magnetError || !magnet) {
    console.error("[capture-lead] magnet not found:", lead_magnet_slug, magnetError);
    return Response.json(
      { success: false, error: "Content not found" },
      { status: 404 }
    );
  }

  // Resolve content type and delivery URL. Older rows pre-migration may
  // not have `type` set — default to 'pdf' so they still send.
  const contentType: ContentType = ALLOWED_TYPES.includes(magnet.type)
    ? magnet.type
    : "pdf";
  const deliveryUrlRaw =
    contentType === "youtube" || contentType === "url"
      ? magnet.external_url
      : magnet.pdf_url;

  if (!deliveryUrlRaw) {
    console.error("[capture-lead] magnet has no delivery URL:", lead_magnet_slug, contentType);
    return Response.json(
      { success: false, error: "This content isn't ready yet — try again later." },
      { status: 500 }
    );
  }

  const firstName = full_name.split(" ")[0] || full_name;
  const siteUrl = process.env.SITE_URL || "https://bigronjones.com";
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&magnet=${encodeURIComponent(lead_magnet_slug)}`;
  const deliveryUrl = deliveryUrlRaw.startsWith("http")
    ? deliveryUrlRaw
    : `${siteUrl}${deliveryUrlRaw}`;

  // Day 1 nurture email lands tomorrow at 9am.
  const tomorrow9am = new Date();
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  // 3. Upsert the lead — re-submitters update rather than duplicate.
  // The unique constraint on (email, lead_magnet_slug) makes this atomic.
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .upsert(
      {
        full_name,
        email,
        phone: phone || null,
        lead_magnet_id: magnet.id,
        lead_magnet_slug,
        source: utm_source === "instagram" ? "instagram" : "website",
        utm_source,
        utm_campaign,
        utm_content,
        referrer_url,
        status: "new",
        sequence_day: 0,
        sequence_paused: false,
        next_email_due_at: tomorrow9am.toISOString(),
        pdf_sent: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email,lead_magnet_slug", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (leadError || !lead) {
    console.error("[capture-lead] Supabase upsert failed:", leadError);
    return Response.json(
      {
        success: false,
        error: "We couldn't record your details right now — please try again in a moment.",
      },
      { status: 500 }
    );
  }

  // 4. Build email body and send.
  const emailHtml = contentDeliveryEmail({
    firstName,
    contentTitle: magnet.title,
    contentType,
    deliveryUrl,
    unsubscribeUrl,
  });

  const subject = magnet.email_subject || `Your Free ${magnet.title} from BigRonJones`;

  // For downloadable types (pdf/ebook/file), attach the actual file so it lands
  // directly in the inbox — not just a link. YouTube/URL types stay link-only.
  const isFileType =
    contentType === "pdf" || contentType === "ebook" || contentType === "file";
  let attachments: Array<{ filename: string; path: string }> | undefined;
  if (isFileType && deliveryUrl.startsWith("http")) {
    const ext =
      deliveryUrl.split("?")[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ||
      "pdf";
    const safeBase =
      (magnet.title?.trim() || lead_magnet_slug)
        .replace(/[^\w.\- ]+/g, "")
        .trim()
        .replace(/\s+/g, "-") || "your-guide";
    attachments = [{ filename: `${safeBase}.${ext}`, path: deliveryUrl }];
  }

  let emailSent = false;
  let emailError: string | null = null;

  // Send if any transport is configured (Gmail SMTP preferred, else Resend).
  if (process.env.GMAIL_USER || process.env.RESEND_API_KEY) {
    const result = await sendEmail({
      to: email,
      subject,
      html: emailHtml,
      text: `Hi ${firstName}, your content is ready: ${deliveryUrl}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      attachments,
    });
    emailSent = result.ok;
    if (!result.ok) {
      emailError = result.detail || result.reason;
      console.error("[capture-lead] email send failed:", emailError);
    }
  } else {
    console.warn(
      `[capture-lead][DEV] No email transport set — would send to ${email}: ${deliveryUrl}`
    );
    // In dev with no transport, treat as sent so the UI flows correctly.
    emailSent = true;
  }

  // 5. Stamp pdf_sent and bump the magnet's download counter.
  if (emailSent) {
    await supabase
      .from("leads")
      .update({
        pdf_sent: true,
        pdf_sent_at: new Date().toISOString(),
        sequence_day: 0,
      })
      .eq("id", lead.id);

    await supabase
      .from("lead_magnets")
      .update({ download_count: (magnet.download_count || 0) + 1 })
      .eq("id", magnet.id);
  }

  return Response.json({
    success: true,
    message: `Your content has been sent to ${email}`,
    firstName,
    emailSent,
    ...(emailError ? { emailError } : {}),
  });
}
