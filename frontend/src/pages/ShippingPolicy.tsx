import LegalShell from "@/components/shared/LegalShell";
import { siteData } from "@/data/site";

export default function ShippingPolicyPage() {
  return (
    <>
              <title>Shipping Policy | BigRonJones</title>
        <meta
          name="description"
          content="Shipping, processing times, and delivery for BigRonJones physical products."
        />
      <LegalShell eyebrow="LEGAL" title="SHIPPING POLICY" lastUpdated="April 26, 2026">
        <p>
          Most BigRonJones offerings are digital and delivered instantly, but a
          few products (like the Band Powered Workout bundle) ship physical
          equipment.
        </p>

        <h2>Digital Products &amp; Programs</h2>
        <p>
          Coaching access, program materials, and consultation calendar links
          are delivered by email immediately after purchase. If you don&apos;t
          receive the email within 15 minutes, check your spam folder, then
          contact{" "}
          <a href={`mailto:${siteData.contact.supportEmail}`}>
            {siteData.contact.supportEmail}
          </a>
          .
        </p>

        <h2>Physical Products</h2>
        <h3>Processing</h3>
        <p>
          Orders are processed within 1–2 business days. You&apos;ll receive a
          tracking link by email when your order ships.
        </p>

        <h3>Delivery times</h3>
        <ul>
          <li>
            <strong>United States:</strong> 3–7 business days via standard
            ground.
          </li>
          <li>
            <strong>Canada:</strong> 5–10 business days.
          </li>
          <li>
            <strong>International:</strong> 10–21 business days. Customs and
            import duties are the responsibility of the recipient.
          </li>
        </ul>

        <h3>Shipping costs</h3>
        <p>
          Calculated at checkout based on weight and destination. Free shipping
          promotions, when available, are applied automatically.
        </p>

        <h2>Lost or Damaged Packages</h2>
        <p>
          If a package arrives damaged or never arrives, email{" "}
          <a href={`mailto:${siteData.contact.supportEmail}`}>
            {siteData.contact.supportEmail}
          </a>{" "}
          within 14 days of the expected delivery date. We&apos;ll work with the
          carrier and ship a replacement when appropriate.
        </p>
      </LegalShell>
    </>
  );
}
