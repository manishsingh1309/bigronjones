import { createHmac } from "crypto";

/**
 * Validates Calendly webhook signature using HMAC SHA256
 * Calendly sends: X-Calendly-Webhook-Signature header
 * Format: "sha256=<hex>"
 *
 * @param payload Raw request body (string or Buffer)
 * @param signature Header value from X-Calendly-Webhook-Signature
 * @param secret CALENDLY_WEBHOOK_SECRET env var
 * @returns true if signature is valid
 */
export function validateCalendlySignature(
  payload: string | Buffer,
  signature: string | undefined,
  secret: string | undefined,
): boolean {
  if (!signature || !secret) {
    console.error(
      "Signature validation failed: missing signature header or secret",
    );
    return false;
  }

  // Parse signature header: "sha256=abc123..."
  const parts = signature.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    console.error("Invalid signature format");
    return false;
  }

  const providedHash = parts[1];

  // Compute HMAC SHA256
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const computedHash = hmac.digest("hex");

  // Timing-safe comparison
  return computedHash === providedHash;
}

/**
 * Parses Calendly webhook payload safely
 * @returns Object with extracted data or null if parsing fails
 */
export function parseCalendlyPayload(body: unknown): {
  email: string;
  name: string;
  eventStartTime: string;
  eventName: string;
  eventId: string;
} | null {
  try {
    if (typeof body !== "object" || body === null) {
      return null;
    }

    const payload = body as Record<string, unknown>;
    const nestedPayload = (payload.data as Record<string, unknown>) || {};
    const eventBlock =
      (payload.scheduled_event as Record<string, unknown>) ||
      (nestedPayload.scheduled_event as Record<string, unknown>) ||
      (payload.event as Record<string, unknown>) ||
      (nestedPayload.event as Record<string, unknown>) ||
      {};

    // Navigate nested structure: event.data.invitee.email
    const invitee =
      (payload.invitee as Record<string, unknown>) ||
      (nestedPayload.invitee as Record<string, unknown>) ||
      (payload.payload as Record<string, unknown>)?.invitee ||
      {};

    const email = String(invitee.email || "")
      .trim()
      .toLowerCase();
    const name = String(invitee.name || "").trim();
    const eventStartTime = String(eventBlock.start_time || "");
    const eventName = String(eventBlock.name || "").trim();
    const eventId = String(
      eventBlock.uri || eventBlock.event || eventBlock.uuid || "",
    ).trim();

    if (!email || !name || !eventStartTime) {
      console.error("Missing required Calendly fields", {
        email: !!email,
        name: !!name,
        eventStartTime: !!eventStartTime,
      });
      return null;
    }

    return { email, name, eventStartTime, eventName, eventId };
  } catch (error) {
    console.error("Failed to parse Calendly payload:", error);
    return null;
  }
}
