import AboutHero from "@/components/about/AboutHero";
import PhilosophySection from "@/components/about/PhilosophySection";
import TimelineSection from "@/components/about/TimelineSection";
import StatsSection from "@/components/sections/StatsSection";
import CTASection from "@/components/sections/CTASection";

export default function AboutPage() {
  return (
    <>
              <title>About | BigRonJones</title>
        <meta
          name="description"
          content="Meet BigRonJones® — 20+ years helping real people get real results. No gimmicks, no perfection demands. Just practical methods and proven outcomes."
        />
      <AboutHero />
      <PhilosophySection />
      <TimelineSection />
      <StatsSection />
      <CTASection />
    </>
  );
}
