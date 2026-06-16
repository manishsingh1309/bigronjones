export type ProgramDetail = {
  id: string;
  slug: string;
  badge: string;
  title: string;
  tagline: string;
  price: string;
  priceNote: string;
  desc: string;
  fullDesc: string;
  features: string[];
  included: string[];
  whoFor: string[];
  cta: string;
  ctaLink: string;
  featured: boolean;
  image: string;
};

export const programs: ProgramDetail[] = [
  {
    id: "trial",
    slug: "trial",
    badge: "START HERE",
    title: "7-Day Oversight Trial",
    tagline: "Zero risk. Real coaching. Real results.",
    price: "Free Trial",
    priceNote: "No card required",
    desc:
      "7 days of direct coaching oversight from Ron. The fastest way to know if this is right for your life.",
    fullDesc:
      "The 7-Day Oversight Trial puts you directly under Ron's watch for one week. You'll get personalized check-ins, accountability, access to program materials, and a real taste of what it means to have a coach in your corner. No contracts. Cancel after day 7 if it's not for you — but it will be.",
    features: [
      "Available for Men & Women",
      "Direct accountability check-ins",
      "Personalized daily guidance",
      "Access to all program materials",
      "Cancel anytime after trial",
    ],
    included: [
      "Daily check-in protocol",
      "Access to workout library",
      "Nutrition guidelines doc",
      "WhatsApp accountability group",
      "7-day progress tracker",
      "End-of-trial review call with Ron's team",
    ],
    whoFor: [
      "Anyone unsure if structured coaching is for them",
      "People who've tried programs that didn't stick",
      "Beginners who need guidance without a long contract",
      "Returning clients building momentum back",
    ],
    cta: "Start Free Trial",
    ctaLink: "/checkout?program=trial",
    featured: true,
    image: "/images/programs/oversight-trial.png",
  },
  {
    id: "mens",
    slug: "mens",
    badge: "MEN'S",
    title: "Men's Fitness Alliance",
    tagline: "Private strength & wellness oversight for men 35+.",
    price: "Contact for pricing",
    priceNote: "Application required",
    desc:
      "Reclaim control of your health, performance, energy, and confidence through structured oversight, expert guidance, and consistent accountability.",
    fullDesc:
      "The Men's Fitness Alliance isn't another workout program — it's private strength & wellness oversight for men 35+. Weekly 1:1 Zoom with BigRonJones, nutrition guidance from Sean, personalized training and cardio, recovery support, and direct accountability built around your real life.",
    features: [
      "Weekly private Zoom with BigRonJones",
      "Weekly nutrition Zoom with Sean",
      "Personalized training & cardio oversight",
      "Weekly accountability & progress reviews",
      "Private accountability community",
    ],
    included: [
      "Weekly Private Zoom With BigRonJones",
      "Weekly Nutrition Zoom With Sean",
      "Personalized Training Plan",
      "Personalized Cardio Plan",
      "Recovery & Lifestyle Guidance",
      "Private Accountability Community",
      "Direct Oversight From Our Team",
      "Adjustments Based On Real Life",
    ],
    whoFor: [
      "You're 35 or older and want guidance, not guesswork",
      "You have a career, family, and real responsibilities",
      "You're ready to follow a plan and be accountable",
      "You want long-term health, not quick fixes",
    ],
    cta: "Apply to Join",
    ctaLink: "https://thebigronjones.com/fitnessalliance",
    featured: false,
    image: "/images/programs/mens-fitness-alliance.png",
  },
  {
    id: "womens",
    slug: "womens",
    badge: "WOMEN'S",
    title: "Women's Wellness Program",
    tagline: "Real results without the overwhelm.",
    price: "Contact for pricing",
    priceNote: "Application required",
    desc:
      "Built for women who want accountability, movement, and mindset — all in one supportive space.",
    fullDesc:
      "This isn't a weight loss program. It's a life program. Ron's Women's Wellness Program is built around the real demands on women's time, energy, and bodies. Accountability partners, flexible workout plans, nutrition + lifestyle coaching, and a community that actually shows up.",
    features: [
      "Female-focused wellness approach",
      "Accountability partner system",
      "Flexible workout plans",
      "Nutrition + lifestyle coaching",
      "Supportive community space",
    ],
    included: [
      "Women's-specific programming",
      "Hormone & nutrition guidance (with Dr. Shelia & Sean)",
      "Accountability partner matching",
      "Weekly group coaching",
      "Mindset + wellness modules",
      "Private community access",
    ],
    whoFor: [
      "Women juggling work, family, and self-care",
      "Anyone tired of one-size-fits-all programs",
      "Postpartum or perimenopausal rebuilds",
      "Women who want sustainable progress, not crash results",
    ],
    cta: "Apply to Join",
    ctaLink: "https://thebigronjones.com/womenaccountability",
    featured: false,
    image: "/images/programs/bigronjones-61.jpg",
  },
];

export const getProgramBySlug = (slug: string): ProgramDetail | undefined =>
  programs.find((p) => p.slug === slug);

/** Map a program slug to a synthetic cart line. Used when /checkout?program=trial
 *  or similar is hit and we want the user to land on a populated cart. */
export const getProgramAsCartItem = (slug: string) => {
  const program = getProgramBySlug(slug);
  if (!program) return null;
  return {
    id: `program-${program.slug}`,
    slug: program.slug,
    name: program.title,
    price: program.slug === "trial" ? 2 : 0, // TEMP (live-payment test): trial $2, revert to 149. Priced programs route through /apply.
    category: "program" as const,
    description: program.desc,
    fullDescription: program.fullDesc,
    features: program.features,
    image: program.image,
    coach: "Big Ron Jones",
    cta: program.cta,
  };
};
