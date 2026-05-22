import LegalShell from "@/components/shared/LegalShell";
import { siteData } from "@/data/site";

export default function PrivacyPage() {
  return (
    <>
              <title>Privacy Policy | BigRonJones</title>
        <meta
          name="description"
          content="How BigRonJones collects, uses, and protects your information."
        />
      <LegalShell eyebrow="LEGAL" title="PRIVACY POLICY" lastUpdated="April 26, 2026">
        <p>
          {siteData.legalName} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;BigRonJones&rdquo;) respects your privacy. This policy explains
          what we collect, how we use it, and the controls you have. By using
          bigronjones.com you consent to the practices described here.
        </p>

        <h2>What We Collect</h2>
        <h3>Information you give us</h3>
        <ul>
          <li>
            Contact details when you fill out a form (name, email, phone, the
            message you sent us).
          </li>
          <li>
            Application details when you apply to a coaching program (training
            history, goals, commitment level).
          </li>
          <li>Order details when you purchase a product or program.</li>
        </ul>

        <h3>Information we collect automatically</h3>
        <ul>
          <li>
            Standard server logs (IP address, user-agent, pages requested) for
            security and analytics.
          </li>
          <li>
            Aggregate analytics from privacy-friendly tools (page views, source,
            rough geography). We don&apos;t sell this data.
          </li>
          <li>Cookies for site functionality and basic analytics.</li>
        </ul>

        <h2>How We Use It</h2>
        <ul>
          <li>To respond to your messages and applications.</li>
          <li>
            To deliver coaching, content, and the programs you sign up for.
          </li>
          <li>
            To send you the newsletter you opted into. You can unsubscribe at any
            time using the link in any email.
          </li>
          <li>
            To process payments via{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer">
              Stripe
            </a>{" "}
            (we don&apos;t store your card details).
          </li>
        </ul>

        <h2>Who We Share It With</h2>
        <p>
          We share data only with service providers who help us run the
          business: email delivery (Resend), payments (Stripe), analytics, and
          hosting. We never sell your data.
        </p>

        <h2>Your Rights</h2>
        <p>
          You can request access, correction, or deletion of your personal data
          at any time by emailing{" "}
          <a href={`mailto:${siteData.contact.email}`}>
            {siteData.contact.email}
          </a>
          . If you&apos;re in the EU, UK, or California, you have additional
          rights under GDPR/CCPA, including the right to object to processing
          and the right to data portability.
        </p>

        <h2>Children</h2>
        <p>
          BigRonJones is not directed at children under 13. The Pediatrics
          Program is designed for parents — registration and payment are handled
          by the adult guardian.
        </p>

        <h2>Changes</h2>
        <p>
          We&apos;ll update this page when our practices change. Material changes
          will be announced via email to active customers and on this page with a
          new &ldquo;Last updated&rdquo; date.
        </p>
      </LegalShell>
    </>
  );
}
