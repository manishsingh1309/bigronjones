import LegalShell from "@/components/shared/LegalShell";
import { siteData } from "@/data/site";

export default function RefundPolicyPage() {
  return (
    <>
              <title>Refund Policy | BigRonJones</title>
        <meta
          name="description"
          content="Our refund and cancellation policy for BigRonJones programs and products."
        />
      <LegalShell eyebrow="LEGAL" title="REFUND POLICY" lastUpdated="April 26, 2026">
        <p>
          We back our work. If a program or product isn&apos;t a fit, here&apos;s
          how refunds and cancellations work.
        </p>

        <h2>7-Day Trial</h2>
        <p>
          The 7-Day Trial is free. There is nothing to refund. If you decide not
          to continue, you can cancel anytime before day 7 and you&apos;ll never
          be charged.
        </p>

        <h2>Coaching Programs (Men&apos;s Alliance &amp; Women&apos;s Wellness)</h2>
        <ul>
          <li>
            Cancel anytime — your subscription will not renew. You retain access
            for the period you paid for.
          </li>
          <li>
            14-day satisfaction guarantee on first-time enrollment: if
            you&apos;ve done the work (logged check-ins, completed at least one
            coach call) and don&apos;t feel the program is a fit, email us
            within 14 days for a full refund.
          </li>
          <li>
            Subsequent renewal periods are non-refundable, but you can cancel at
            any time to prevent the next renewal.
          </li>
        </ul>

        <h2>Private Coaching Calls &amp; Nutrition Calls</h2>
        <ul>
          <li>
            Sessions can be rescheduled up to 24 hours before the booked time at
            no charge.
          </li>
          <li>
            Sessions cancelled within 24 hours of the start time, or no-shows,
            are non-refundable.
          </li>
          <li>
            If a session is unsatisfactory, contact us within 7 days and
            we&apos;ll work with you on a fix or a partial refund at our
            discretion.
          </li>
        </ul>

        <h2>Digital Products (Band Workout, Pediatrics Program, etc.)</h2>
        <p>
          Because digital products are delivered immediately, all sales are
          final once content has been accessed. If you experienced a delivery
          issue, technical problem, or didn&apos;t receive what was promised,
          email us within 30 days and we&apos;ll make it right.
        </p>

        <h2>Physical Products (Equipment Bundles)</h2>
        <p>
          Unused, undamaged equipment in original packaging can be returned
          within 30 days of delivery. Customer covers return shipping. Used
          equipment cannot be returned for hygiene reasons.
        </p>

        <h2>How to Request a Refund</h2>
        <p>
          Email{" "}
          <a href={`mailto:${siteData.contact.supportEmail}`}>
            {siteData.contact.supportEmail}
          </a>{" "}
          with your order number and the reason for the request. We&apos;ll
          respond within 2 business days. Approved refunds are processed back to
          the original payment method within 5–10 business days.
        </p>
      </LegalShell>
    </>
  );
}
