import PageHeader from "@/components/shared/PageHeader";
import TestimonialsGrid from "@/components/testimonials/TestimonialsGrid";
import CTASection from "@/components/sections/CTASection";

export default function TestimonialsPage() {
  return (
    <>
              <title>Testimonials | BigRonJones</title>
        <meta
          name="description"
          content="Real stories from real BigRonJones clients. 4.9/5 rating, 2,000+ members, and the kind of progress that actually sticks."
        />
      <section className="bg-[#050505] pt-28 pb-12 md:pt-36 md:pb-16">
        <PageHeader
          eyebrow="REAL CLIENTS"
          headline={["REAL STORIES.", "REAL RESULTS."]}
          sub="No actors. No before-and-afters from someone else's gym. Just BigRon clients sharing what changed."
        />
      </section>

      <section className="bg-[#0f0f0f] py-10">
        <div className="mx-auto grid max-w-[1300px] grid-cols-2 gap-6 px-6 md:grid-cols-3 md:px-10">
          {[
            { v: "4.9", l: "/ 5 client rating" },
            { v: "2,000+", l: "Clients coached" },
            { v: "98%", l: "Program retention" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p
                className="font-['Bebas_Neue'] leading-none text-[#E8192C]"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                {s.v}
              </p>
              <p className="mt-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.25em] text-white/50">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      <TestimonialsGrid />

      <CTASection />
    </>
  );
}
