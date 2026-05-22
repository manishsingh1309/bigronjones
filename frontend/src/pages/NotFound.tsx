import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <>
              <title>Not Found | BigRonJones</title>
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-[#050505] px-6 py-20 md:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(232,25,44,0.12), transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <p
            aria-hidden
            className="font-['Bebas_Neue'] leading-none text-[#E8192C]"
            style={{ fontSize: "clamp(8rem, 22vw, 18rem)" }}
          >
            404
          </p>

          <p className="mt-2 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — WRONG TURN
          </p>

          <h1
            className="mt-4 font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
          >
            YOU TOOK A
            <br />
            WRONG TURN.
          </h1>

          <p className="mx-auto mt-6 max-w-xl font-['DM_Sans'] text-base leading-relaxed text-white/65">
            Even Big Ron has off days. This page doesn&apos;t exist — but the
            path back to real progress does.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
            >
              Back to Home
              <ArrowRight size={13} />
            </Link>
            <Link
              to="/programs"
              className="inline-flex items-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
