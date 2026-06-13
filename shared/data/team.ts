export type TeamMember = {
  id: string;
  slug: string;
  name: string;
  role: string;
  specialty: string;
  bio: string[];
  longBio: string;
  quote: string;
  image: string;
  credentials: string[];
  social: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    facebook?: string;
  };
  statusLabel: string;
};

export const team: TeamMember[] = [
  {
    id: "ron",
    slug: "ron",
    name: "BigRonJones",
    role: "Head Coach & Founder",
    specialty: "Fitness, Accountability & Real-World Results",
    bio: [
      "You're not getting random workouts. You're getting direct oversight.",
      "Every week, your training is adjusted, your progress is reviewed, and your plan stays aligned with your real life.",
      "This is where structure replaces guesswork.",
    ],
    longBio:
      "BigRonJones has spent over 20 years helping real people cut through the noise of fitness culture. No gimmicks, no unachievable standards. Whether you're a working dad, a rebuilding mom, or anyone over 35 ready to stop settling — BigRonJones' programs meet you exactly where you are. The approach is simple: practical methods, real-world goals, proven results. No perfection. Just progress, consistency, and the kind of accountability that actually moves the needle.",
    quote:
      "No perfect life required. Show up, stay consistent, and the progress follows.",
    image: "/images/team/ron-founder.png",
    credentials: [
      "20+ Years Coaching",
      "2,000+ Clients Coached",
      "4.9/5 Client Rating",
      "Featured On Top Fitness Platforms",
    ],
    social: {
      instagram: "https://instagram.com/bigronjones",
      youtube: "https://youtube.com/@bigronjones",
      tiktok: "https://tiktok.com/@bigronjones",
      facebook: "https://facebook.com/bigronjones",
    },
    statusLabel: "INCLUDED IN 7-DAY TRIAL",
  },
  {
    id: "sean",
    slug: "sean",
    name: "Sean",
    role: "Nutritionist",
    specialty: "Custom Nutrition Planning & Meal Strategy",
    bio: [
      "Nutrition isn't about restriction. It's about structure you can actually follow.",
      "Sean builds your plan around your real schedule, your habits, and your goals — so you're not starting over every week.",
      "This is where consistency finally starts to stick.",
    ],
    longBio:
      "Sean is BigRon's in-house nutrition expert. He doesn't sell diets — he builds sustainable eating strategies around your real life, food preferences, and goals. Practical. Science-based. No nonsense. Sean works directly with every BigRon client who wants nutrition support, and he's the man behind every personalized meal plan that comes out of the BigRonJones ecosystem.",
    quote:
      "You don't need a perfect diet. You need a plan that actually fits your life.",
    image: "/images/team/sean.png",
    credentials: [
      "Certified Nutritionist",
      "Specializes in Real-World Nutrition",
      "Works with all BigRon clients",
      "Custom Meal Plan Design",
    ],
    social: {},
    statusLabel: "INCLUDED IN FULL PROGRAM",
  },
  {
    id: "shelia",
    slug: "shelia",
    name: "Dr. Shelia",
    role: "Hormone Specialist",
    specialty: "Hormonal Health & Optimization",
    bio: [
      "When hormones are part of the problem, guessing won't fix it.",
      "Dr. Shelia brings clinical-level insight to help close the gap between effort and results — especially for women navigating real physiological changes.",
      "This is where deeper issues get addressed the right way.",
    ],
    longBio:
      "Dr. Shelia brings medical-level expertise to the BigRonJones ecosystem. As a hormone specialist, she helps clients understand how hormonal balance directly affects weight, energy, mood, and fitness results. For anyone over 35 — or anyone struggling to see results despite doing everything right — Dr. Shelia is the missing piece. She works with BigRon's team to identify and address the hormonal factors that often derail otherwise solid programs.",
    quote:
      "Your hormones aren't working against you. They just need the right environment.",
    image: "/images/team/shelia.png",
    credentials: [
      "Board Certified",
      "Hormone Optimization Specialist",
      "Medical Professional",
      "Clinical Wellness Expert",
    ],
    social: {},
    statusLabel: "AVAILABLE IN WOMEN'S PROGRAM",
  },
];

export const getTeamMemberBySlug = (slug: string): TeamMember | undefined =>
  team.find((m) => m.slug === slug);
