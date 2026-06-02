import { lazy, Suspense } from "react";
import HeroSection from "@/components/sections/HeroSection";
import MarqueeBand from "@/components/sections/MarqueeBand";
import CredibilityStrip from "@/components/sections/CredibilityStrip";

const ProgramsSection = lazy(
  () => import("@/components/sections/ProgramsSection"),
);
const TrialSection = lazy(() => import("@/components/sections/TrialSection"));
const SplineSection = lazy(() => import("@/components/sections/SplineSection"));
const WhyThisWorksSection = lazy(
  () => import("@/components/sections/WhyThisWorksSection"),
);
const StatsSection = lazy(() => import("@/components/sections/StatsSection"));
const AboutSection = lazy(() => import("@/components/sections/AboutSection"));
const TeamPreview = lazy(() => import("@/components/sections/TeamPreview"));
const TestimonialsSection = lazy(
  () => import("@/components/sections/TestimonialsSection"),
);
const FAQSection = lazy(() => import("@/components/sections/FAQSection"));
const BlogSection = lazy(() => import("@/components/sections/BlogSection"));
const CTASection = lazy(() => import("@/components/sections/CTASection"));

export default function Home() {
  return (
    <>
      <title>BigRonJones | Programs Built For Your World</title>
      <meta
        name="description"
        content="Private fitness oversight for adults 35+ through training, nutrition, accountability, and weekly coaching. Start your 7-day trial with Big Ron Jones."
      />
      {/* 2 — Hero */}
      <HeroSection />

      {/* Credibility Strip */}
      <CredibilityStrip />

      <MarqueeBand />
      {/* 3 — Program selection */}
      <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
        <ProgramsSection />
      </Suspense>
      {/* 4 — 7-Day Trial */}
      <Suspense fallback={<div className="h-screen bg-[#0a0a0a]" />}>
        <TrialSection />
      </Suspense>
      {/* 5 — Video / Meet BigRonJones */}
      <Suspense fallback={<div className="h-[600px] bg-[#050505]" />}>
        <SplineSection />
      </Suspense>
      {/* 6 — Why this works */}
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <WhyThisWorksSection />
      </Suspense>
      <Suspense fallback={<div className="h-32 bg-[#0d0d0d]" />}>
        <StatsSection />
      </Suspense>
      <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <TeamPreview />
      </Suspense>
      {/* 7 — Social proof */}
      <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
        <TestimonialsSection />
      </Suspense>
      {/* 8 — FAQ */}
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <FAQSection />
      </Suspense>
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <BlogSection />
      </Suspense>
      {/* 9 — Final CTA */}
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <CTASection />
      </Suspense>
    </>
  );
}
