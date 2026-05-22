import { lazy, Suspense } from "react";
import HeroSection from "@/components/sections/HeroSection";
import MarqueeBand from "@/components/sections/MarqueeBand";

const StatsSection = lazy(() => import("@/components/sections/StatsSection"));
const AboutSection = lazy(() => import("@/components/sections/AboutSection"));
const ProgramsSection = lazy(() => import("@/components/sections/ProgramsSection"));
const TeamPreview = lazy(() => import("@/components/sections/TeamPreview"));
const SplineSection = lazy(() => import("@/components/sections/SplineSection"));
const TestimonialsSection = lazy(() => import("@/components/sections/TestimonialsSection"));
const BlogSection = lazy(() => import("@/components/sections/BlogSection"));
const CTASection = lazy(() => import("@/components/sections/CTASection"));

export default function Home() {
  return (
    <>
              <title>BigRonJones | Practical Advice For Your Real World Goals</title>
        <meta
          name="description"
          content="Fitness coaching, wellness programs, and real accountability from Big Ron Jones. Practical methods. Real-world goals. Proven results."
        />
      <HeroSection />
      <MarqueeBand />
      <Suspense fallback={<div className="h-32 bg-[#0d0d0d]" />}>
        <StatsSection />
      </Suspense>
      <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
        <ProgramsSection />
      </Suspense>
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <TeamPreview />
      </Suspense>
      <Suspense fallback={<div className="h-[600px] bg-[#050505]" />}>
        <SplineSection />
      </Suspense>
      <Suspense fallback={<div className="h-screen bg-[#050505]" />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <BlogSection />
      </Suspense>
      <Suspense fallback={<div className="h-96 bg-[#050505]" />}>
        <CTASection />
      </Suspense>
    </>
  );
}
