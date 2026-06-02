import { Link } from "react-router-dom";
import { Fragment } from "react";
import { ArrowRight, Calendar, MessageCircle, Target } from "lucide-react";
import { products } from "@/data/products";
import PageHeader from "@/components/shared/PageHeader";
import FAQAccordion from "@/components/shared/FAQAccordion";
import BrandName from "@/components/shared/BrandName";

function withBrand(text: string) {
  const parts = text.split(/(BigRonJones)/g);
  return parts.map((part, i) =>
    part === "BigRonJones" ? (
      <BrandName key={i} />
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

const consultProducts = products.filter((p) => p.category === "consult");

const steps = [
  {
    icon: Calendar,
    title: "BOOK YOUR CALL",
    desc: "Pick the call you want — Ron for fitness/coaching, Sean for nutrition. Pay $79.99 to lock the slot.",
  },
  {
    icon: MessageCircle,
    title: "GET ON THE LINE",
    desc: "60 minutes, 1-on-1. Bring your situation, your obstacles, your real goals. Nothing off-limits.",
  },
  {
    icon: Target,
    title: "WALK AWAY WITH A PLAN",
    desc: "Custom assessment. Direct next steps. Follow-up summary in your inbox the same week.",
  },
];

const faqs = [
  {
    q: "Is the call a sales pitch?",
    a: "No. You'll leave with real value whether you ever buy a program or not. Ron and Sean believe consults should solve a problem — not pre-sell one.",
  },
  {
    q: "What happens after I book?",
    a: "Right after payment, you'll land on a confirmation page where you can pick your 60-minute slot on the spot — the calendar invite arrives in your inbox the moment you book. A short intake form follows so we show up prepared with your context.",
  },
  {
    q: "Do you record the call?",
    a: "Only if you want it. After the session, we send a written summary regardless — your action plan, in writing.",
  },
  {
    q: "Can I bring my partner / spouse on the call?",
    a: "Absolutely. A lot of clients do this for the nutrition call especially — easier to align as a household than to repeat the conversation later.",
  },
  {
    q: "What if I want to talk to Dr. Shelia?",
    a: "Dr. Shelia takes hormone-specific consultations on referral. After your call with Ron, if a hormone workup makes sense, we'll route you to her directly.",
  },
];

export default function ConsultPage() {
  return (
    <>
      <title>Consult | BigRonJones</title>
      <meta
        name="description"
        content="Book a private consultation with Ron or Sean. Direct, personal coaching calls — no fluff, no upsells."
      />
      <section className="relative overflow-hidden bg-[#050505] pt-28 pb-12 md:pt-36 md:pb-16">
        <PageHeader
          eyebrow="PRIVATE COACHING CALL"
          headline={["PRIVATE COACHING", "CALL WITH", "BIGRONJONES®"]}
          sub="Use this private call to get clear on your starting point, your biggest obstacles, and the best coaching direction for your goals."
        />
      </section>

      <section className="bg-[#050505] py-12 md:py-16">
        <div className="mx-auto max-w-[1300px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {consultProducts.map((p) => (
              <article
                key={p.id}
                className="group relative flex flex-col overflow-hidden border border-[#1a1a1a] bg-[#0f0f0f] transition-colors hover:border-[#E8192C]/40"
              >
                <div className="relative h-[400px] w-full overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.coach}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    style={{ objectPosition: "center 25%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
                  <span className="absolute right-4 top-4 bg-[#E8192C] px-3 py-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white">
                    {p.badge}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-5 p-7">
                  <div>
                    <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-[#E8192C]">
                      With {withBrand(p.coach)}
                    </p>
                    <h3 className="mt-2 font-['Bebas_Neue'] text-3xl tracking-wide text-white">
                      {withBrand(p.name)}
                    </h3>
                    <p className="mt-1 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white/40">
                      {p.duration}
                    </p>
                  </div>

                  <p className="font-['DM_Sans'] text-sm leading-relaxed text-white/65">
                    {withBrand(p.fullDescription)}
                  </p>

                  <ul className="flex flex-col gap-2">
                    {p.features.slice(0, 4).map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 font-['DM_Sans'] text-[13px] text-white/75"
                      >
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 bg-[#E8192C]" />
                        {withBrand(f)}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex items-baseline gap-2">
                    <span className="font-['Bebas_Neue'] text-4xl tracking-wide text-[#E8192C]">
                      ${p.price.toFixed(2)}
                    </span>
                    <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                      USD
                    </span>
                  </div>

                  <Link
                    to={`/shop/${p.slug}`}
                    className="inline-flex items-center justify-center gap-2 bg-[#E8192C] px-6 py-3.5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
                  >
                    {withBrand(p.cta)}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/50">
            ★★★★★ &nbsp; 4.9/5 from 200+ private consultations
          </p>
        </div>
      </section>

      <section className="bg-[#050505] py-24 md:py-28">
        <div className="mx-auto max-w-[1300px] px-6 md:px-10">
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — WHAT HAPPENS
          </p>
          <h2
            className="mb-12 font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
          >
            HOW THE CALL <span className="text-[#E8192C]">WORKS.</span>
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative flex flex-col gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-7"
              >
                <span className="absolute right-5 top-5 font-['Bebas_Neue'] text-5xl leading-none tracking-wide text-white/[0.06]">
                  0{i + 1}
                </span>
                <div className="flex h-12 w-12 items-center justify-center bg-[#E8192C]">
                  <s.icon size={20} className="text-white" strokeWidth={2.2} />
                </div>
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
                  {s.title}
                </h3>
                <p className="font-['DM_Sans'] text-sm leading-relaxed text-white/60">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0f0f0f] py-20">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-10">
          <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#E8192C]">
            — RON&apos;S TAKE
          </p>
          <blockquote className="mt-5">
            <p
              className="font-['Bebas_Neue'] leading-[1.05] text-white"
              style={{ fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)" }}
            >
              &ldquo;A 60-MINUTE CALL CAN SAVE YOU 20 YEARS OF GUESSING.
              THAT&apos;S WHY WE DO THIS.&rdquo;
            </p>
            <footer className="mt-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/60">
              — <BrandName />
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="bg-[#050505] py-24 md:py-28">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — FAQ
          </p>
          <h2
            className="mb-10 font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
          >
            ASKED &amp; <span className="text-[#E8192C]">ANSWERED.</span>
          </h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>
    </>
  );
}
