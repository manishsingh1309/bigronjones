import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { team } from "@/data/team";
import PageHeader from "@/components/shared/PageHeader";
import TeamCard from "@/components/shared/TeamCard";

export default function TeamPage() {
  const [ron, sean, shelia] = team;

  return (
    <>
              <title>Team | BigRonJones</title>
        <meta
          name="description"
          content="Meet the BigRonJones team — Big Ron Jones, Sean (nutritionist), and Dr. Shelia (hormone specialist)."
        />
      <section className="bg-[#050505] pt-28 pb-12 md:pt-36 md:pb-16">
        <PageHeader
          eyebrow="THE TEAM"
          headline={["THE PEOPLE IN", "YOUR CORNER."]}
          sub="Coaching. Nutrition. Hormones. Three specialists. One holistic approach to actually moving the needle."
        />
      </section>

      <section className="bg-[#050505] py-12 md:py-16">
        <div className="mx-auto max-w-[1300px] px-6 md:px-10">
          <TeamCard member={ron} variant="feature" />
        </div>
      </section>

      <section className="bg-[#050505] py-12 md:py-16">
        <div className="mx-auto max-w-[1300px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TeamCard member={sean} index={0} />
            <TeamCard member={shelia} index={1} />
          </div>
        </div>
      </section>

      <section className="bg-[#0f0f0f] py-24 md:py-32">
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-12 px-6 md:px-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
              — WHY A TEAM
            </p>
            <h2
              className="font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
            >
              ONE COACH CAN&apos;T
              <br />
              FIX <span className="text-[#E8192C]">EVERYTHING.</span>
            </h2>
          </div>

          <div className="flex flex-col gap-5 font-['DM_Sans'] text-base leading-[1.85] text-white/65">
            <p>
              Most fitness programs hand you a workout plan and call it a day.
              That&apos;s why most fitness programs fail — because real results
              live at the intersection of training, nutrition, and the
              physiological reality your body is operating in.
            </p>
            <p>
              At BigRonJones, Ron handles the training and accountability. Sean
              owns nutrition strategy. Dr. Shelia steps in when hormones are the
              hidden variable holding everything back.
            </p>
            <p>
              Three specialists. One coordinated plan. That&apos;s how we&apos;re
              able to keep 98% of clients in the program for the long haul.
            </p>
            <Link
              to="/programs/trial"
              className="mt-3 inline-flex w-fit items-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
            >
              Start 7-Day Trial
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
