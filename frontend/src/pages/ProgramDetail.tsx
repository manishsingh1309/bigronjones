import { useParams, Link, Navigate } from "react-router-dom";
import { Check, ArrowRight, ChevronLeft } from "lucide-react";
import { programs, getProgramBySlug, type ProgramDetail } from "@/data/programs";
import ProgramSpotlightCard from "@/components/shared/ProgramSpotlightCard";
import { testimonials } from "@/data/testimonials";

export default function ProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const program = slug ? getProgramBySlug(slug) : null;

  if (!program) return <Navigate to="/404" replace />;

  const filterMap: Record<string, "Trial" | "Mens" | "Womens"> = {
    trial: "Trial",
    mens: "Mens",
    womens: "Womens",
  };
  const programTestimonials = testimonials
    .filter((t) => t.filter === filterMap[program.slug])
    .slice(0, 3);
  // "Explore the rest" cross-sell. Each coaching page (mens/womens) features
  // its own gendered program alongside the 7-Day Trial; the Trial page features
  // the two coaching programs.
  const related: ProgramDetail[] =
    program.slug === "trial"
      ? programs.filter((p) => p.slug !== "trial")
      : [getProgramBySlug("trial"), program].filter(
          (p): p is ProgramDetail => p !== undefined,
        );

  return (
    <>
              <title>{`${program.title} | BigRonJones`}</title>
        <meta name="description" content={program.fullDesc} />
      <div className="bg-[#050505] pt-28 md:pt-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            <ChevronLeft size={14} />
            Back to all programs
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#050505] py-16 md:py-24">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-6 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <span className="w-fit bg-[#E8192C] px-3 py-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white">
              {program.badge}
            </span>
            <h1
              className="font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2.5rem, 7.5vw, 6.5rem)" }}
            >
              {program.title.toUpperCase()}
            </h1>
            <p className="font-['DM_Mono'] text-sm uppercase tracking-[0.18em] text-[#E8192C]">
              {program.tagline}
            </p>
            <p className="max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
              {program.fullDesc}
            </p>

            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="font-['Bebas_Neue'] text-5xl tracking-wide text-[#E8192C]">
                {program.price}
              </span>
              <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/50">
                {program.priceNote}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Link
                to={program.ctaLink}
                className="inline-flex items-center justify-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
              >
                {program.cta}
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/consult"
                className="inline-flex items-center justify-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
              >
                Talk to Ron First
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/5] w-full overflow-hidden border border-[#1a1a1a] lg:aspect-auto">
            <img
              src={program.image}
              alt={program.title}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-50" />
          </div>
        </div>
      </section>

      <section className="bg-[#050505] py-20 md:py-24">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              — WHAT&apos;S INCLUDED
            </p>
            <h2
              className="font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)" }}
            >
              EVERYTHING YOU
              <br />
              NEED TO START.
            </h2>
            <p className="mt-5 max-w-md font-['DM_Sans'] text-sm leading-relaxed text-white/60">
              Inside the {program.title}, here&apos;s exactly what comes with you when you sign up.
            </p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {program.included.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 border border-[#1a1a1a] bg-[#0f0f0f] p-4 transition-colors hover:border-[#E8192C]/40"
              >
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E8192C]" strokeWidth={2.5} />
                <span className="font-['DM_Sans'] text-[15px] text-white/85">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[#0f0f0f] py-20 md:py-24">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10">
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — WHO IT&apos;S FOR
          </p>
          <h2
            className="mb-10 font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)" }}
          >
            BUILT FOR PEOPLE
            <br />
            WHO ARE <span className="text-[#E8192C]">SERIOUS.</span>
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {program.whoFor.map((w, i) => (
              <div key={w} className="flex items-start gap-3 border border-[#1a1a1a] bg-[#050505] p-5">
                <span className="mt-0.5 font-['Bebas_Neue'] text-2xl leading-none text-[#E8192C]">
                  0{i + 1}
                </span>
                <p className="font-['DM_Sans'] text-[15px] leading-relaxed text-white/80">{w}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {programTestimonials.length > 0 && (
        <section className="bg-[#050505] py-20 md:py-24">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              — RESULTS
            </p>
            <h2
              className="mb-10 font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)" }}
            >
              REAL PEOPLE.
              <br />
              <span className="text-[#E8192C]">REAL OUTCOMES.</span>
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {programTestimonials.map((t) => (
                <blockquote key={t.name} className="border border-[#1a1a1a] bg-[#0f0f0f] p-6">
                  <div className="mb-3 flex items-center gap-1">
                    {Array.from({ length: t.stars }).map((_, idx) => (
                      <span key={idx} className="text-[#E8192C]">★</span>
                    ))}
                  </div>
                  <p className="font-['DM_Sans'] text-[15px] leading-relaxed text-white/85">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <footer className="mt-5 flex items-center justify-between">
                    <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60">
                      — {t.name}
                    </p>
                    {t.result && (
                      <span className="bg-[#E8192C]/10 px-2 py-1 font-['DM_Mono'] text-[10px] tracking-[0.15em] text-[#E8192C]">
                        {t.result}
                      </span>
                    )}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#050505] py-20 md:py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — OTHER PROGRAMS
          </p>
          <h2
            className="mb-10 font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)" }}
          >
            EXPLORE THE REST.
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {related.map((p, i) => (
              <ProgramSpotlightCard key={p.id} program={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0f0f0f] py-20 md:py-28">
        <div className="mx-auto max-w-[1100px] px-6 text-center md:px-10">
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — READY?
          </p>
          <h2
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            YOUR JOURNEY <span className="text-[#E8192C]">STARTS NOW.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
            One decision. One program. One coach in your corner. The only thing between you and results is the choice to begin.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={program.ctaLink}
              className="inline-flex items-center justify-center gap-2 bg-[#E8192C] px-8 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
            >
              {program.cta}
              <ArrowRight size={13} />
            </Link>
            <Link
              to="/consult"
              className="inline-flex items-center justify-center gap-2 border border-[#1a1a1a] bg-[#050505] px-8 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
            >
              Book a 1-on-1 Call First
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
