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
    tagline: "A brotherhood built on discipline.",
    price: "Contact for pricing",
    priceNote: "Application required",
    desc:
      "Group accountability for men committed to building strength, discipline, and a body they're proud of — together.",
    fullDesc:
      "The Men's Fitness Alliance isn't a workout app. It's a community of men holding each other accountable to a higher standard. Structured programming, weekly check-ins with Ron, nutrition guidance, and a group of brothers who don't let each other quit.",
    features: [
      "Group accountability community",
      "Structured workout programming",
      "Nutrition guidance",
      "Weekly check-ins with Ron",
      "Exclusive member content",
    ],
    included: [
      "Full periodized workout programming",
      "Ron's nutrition framework",
      "Weekly group calls",
      "Private brotherhood community",
      "Monthly fitness assessments",
      "Direct access to Ron via group threads",
    ],
    whoFor: [
      "Men ready to commit to a long-term standard",
      "Anyone who thrives in group accountability",
      "Lifters who want structure without rigidity",
      "People rebuilding after a fall-off period",
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
    price: program.slug === "trial" ? 149 : 0, // priced programs route through /apply, not direct checkout
    category: "program" as const,
    description: program.desc,
    fullDescription: program.fullDesc,
    features: program.features,
    image: program.image,
    coach: "Big Ron Jones",
    cta: program.cta,
  };
};
