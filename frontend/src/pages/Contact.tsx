import { Mail, Instagram, Youtube, MessageCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ContactForm from "@/components/contact/ContactForm";
import { siteData } from "@/data/site";

const channels = [
  {
    icon: Mail,
    label: "Email",
    value: siteData.contact.email,
    href: `mailto:${siteData.contact.email}`,
  },
  {
    icon: MessageCircle,
    label: "Coaching inquiries",
    value: "Apply to a program",
    href: "/apply",
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@bigronjones",
    href: "https://instagram.com/bigronjones",
  },
  {
    icon: Youtube,
    label: "YouTube",
    value: "@bigronjones",
    href: "https://youtube.com/@bigronjones",
  },
];

export default function ContactPage() {
  return (
    <>
              <title>Contact | BigRonJones</title>
        <meta
          name="description"
          content="Get in touch with Big Ron Jones and the team. For programs, sponsorships, press, and everything in between."
        />
      <section className="bg-[#050505] pt-28 pb-12 md:pt-36 md:pb-16">
        <PageHeader
          eyebrow="GET IN TOUCH"
          headline={["LET'S TALK.", "FOR REAL."]}
          sub="Whether it's coaching, press, partnerships, or something else — drop a note and we'll get back to you fast."
        />
      </section>

      <section className="bg-[#050505] pb-24">
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-12 px-6 md:px-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <aside>
            <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              — DIRECT LINES
            </p>
            <h2
              className="mb-8 font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
            >
              FIND US WHERE
              <br />
              <span className="text-[#E8192C]">YOU LIVE.</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {channels.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="group flex items-center gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#E8192C]/40"
                  >
                    <span className="flex h-10 w-10 items-center justify-center bg-[#E8192C]/10 text-[#E8192C]">
                      <c.icon size={18} />
                    </span>
                    <div className="flex-1">
                      <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/50">
                        {c.label}
                      </p>
                      <p className="font-['DM_Sans'] text-[15px] text-white group-hover:text-[#E8192C]">
                        {c.value}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-10 border border-[#1a1a1a] bg-[#0f0f0f] p-5">
              <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/50">
                Response time
              </p>
              <p className="mt-2 font-['DM_Sans'] text-[15px] text-white/80">
                Most messages get a reply within 24 hours, weekdays. For
                program applications, allow up to 48 hours — Ron reviews each
                personally.
              </p>
            </div>
          </aside>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
