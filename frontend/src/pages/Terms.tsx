import LegalShell from "@/components/shared/LegalShell";
import { siteData } from "@/data/site";

export default function TermsPage() {
  return (
    <>
              <title>Terms of Service | BigRonJones</title>
        <meta
          name="description"
          content="Terms governing the use of BigRonJones programs, products, and services."
        />
      <LegalShell eyebrow="LEGAL" title="TERMS OF SERVICE" lastUpdated="April 26, 2026">
        <p>
          Welcome. These Terms of Service govern your use of bigronjones.com and
          every program, product, and consultation offered by{" "}
          {siteData.legalName}. By using the site or purchasing anything from us,
          you agree to be bound by these terms.
        </p>

        <h2>Eligibility</h2>
        <p>
          You must be at least 18 years old (or have parental consent) to
          purchase a program. By signing up you confirm you can lawfully enter a
          binding agreement.
        </p>

        <h2>Health Disclaimer</h2>
        <p>
          Our content is for educational and motivational purposes. It is not
          medical advice. Consult a qualified healthcare provider before
          starting any new exercise or nutrition plan, especially if you have a
          pre-existing condition, are pregnant, or are recovering from injury.
          You assume all risk associated with following our programs.
        </p>

        <h2>Programs &amp; Coaching</h2>
        <ul>
          <li>
            Application-based programs (Men&apos;s Alliance, Women&apos;s
            Wellness) are subject to acceptance. Submitting an application does
            not guarantee enrollment.
          </li>
          <li>
            Subscriptions and trials renew automatically unless cancelled before
            the renewal date. You can cancel from your account or by emailing{" "}
            <a href={`mailto:${siteData.contact.email}`}>
              {siteData.contact.email}
            </a>
            .
          </li>
          <li>
            Coaching is delivered as described on the program page. We reserve
            the right to substitute coaches of equivalent qualification.
          </li>
        </ul>

        <h2>Payments</h2>
        <p>
          All payments are processed in USD via Stripe. You authorize us to
          charge your payment method for the agreed amount. Failed payments may
          result in suspension of access until resolved.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All site content — text, images, video, programs, training plans —
          belongs to {siteData.legalName} and is protected by copyright. You get
          a personal, non-transferable license to use the materials for your own
          training. You may not redistribute, resell, or use the content to
          train others commercially without written permission.
        </p>

        <h2>Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the site for unlawful purposes.</li>
          <li>Attempt to gain unauthorized access to any system.</li>
          <li>
            Scrape, automate, or harvest content beyond fair use without
            permission.
          </li>
          <li>
            Misrepresent yourself or impersonate another person in a coaching
            context.
          </li>
        </ul>

        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, {siteData.legalName} is not
          liable for indirect, incidental, special, or consequential damages
          arising from your use of the site or programs. Total liability for any
          claim is limited to the amount you paid us in the 12 months before the
          claim arose.
        </p>

        <h2>Termination</h2>
        <p>
          We may suspend or terminate your access for material breach of these
          terms. Upon termination, your license to the materials ends, but
          anything you&apos;ve already paid for remains accessible per the
          product description.
        </p>

        <h2>Governing Law</h2>
        <p>
          These terms are governed by the laws of the United States and the
          state in which {siteData.legalName} is registered, without regard to
          conflict-of-law principles.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a href={`mailto:${siteData.contact.email}`}>
            {siteData.contact.email}
          </a>
          .
        </p>
      </LegalShell>
    </>
  );
}
