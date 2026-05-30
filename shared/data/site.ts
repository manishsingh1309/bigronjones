export const siteData = {
  brand: "BIGRONJONES",
  url: "https://bigronjones.com",
  legalName: "Big Ron Jones LLC",
  contact: {
    email: "hello@bigronjones.com",
    supportEmail: "support@bigronjones.com",
    pressEmail: "press@bigronjones.com",
    // Replace with the real business address if/when it should be public.
    addressLine1: "Big Ron Jones LLC",
    addressLine2: "United States",
  },
  nav: [
    { label: "HOME", href: "#home" },
    { label: "ABOUT", href: "#about" },
    { label: "PROGRAMS", href: "#programs" },
    { label: "TESTIMONIALS", href: "#testimonials" },
    { label: "BLOG", href: "#blog" },
    { label: "CONSULT", href: "#consult" },
  ],
  hero: {
    tagline: "BUILT FOR REAL LIFE",
    sub: "FITNESS  •  WELLNESS  •  ACCOUNTABILITY",
    lines: [
      { text: "PROGRAMS BUILT", color: "white" as const },
      { text: "FOR YOUR", color: "white" as const },
      { text: "WORLD.", color: "crimson" as const },
    ],
    role: "Personal Fitness Coach & Accountability Partner",
    cta: "Start 7-Day Trial",
    ctaSub: "No contracts. Cancel anytime.",
    image: "/assets/ron-hero.jpg",
  },
  stats: [
    { value: 20, suffix: "+", label: "Years Coaching" },
    { value: 2000, suffix: "+", label: "Community Members" },
    { value: 4.9, suffix: "/5", label: "Client Rating" },
    { value: 98, suffix: "%", label: "Client Retention" },
  ],
  marquee: [
    "TRANSFORM YOUR BODY",
    "BUILT FOR REAL LIFE",
    "2,000+ COMMUNITY MEMBERS",
    "20+ YEARS COACHING",
    "FITNESS • WELLNESS • ACCOUNTABILITY",
    "4.9/5 CLIENT SATISFACTION",
    "NO GIMMICKS. JUST RESULTS.",
    "START YOUR 7-DAY TRIAL TODAY",
  ],
  programs: [
    {
      badge: "MEN'S 7-DAY TRIAL",
      title: "Men's Fitness Alliance™",
      tagline: "STRUCTURE. ACCOUNTABILITY. NO MORE GUESSING.",
      desc: [
        "Built for men who want structure, accountability, and sustainable health without sacrificing real life.",
      ],
      features: [
        "Structured training plan (gym or home)",
        "Weekly accountability check-ins",
        "Nutrition guidance that fits real life",
        "Clear direction. No guesswork",
        "Built for consistency, not intensity spikes",
      ],
      cta: "Explore MFA",
      featured: true,
      image: "/images/programs/mens-fitness-alliance.png",
      imagePosition: "object-center",
      href: "/programs/trial",
    },
    {
      badge: "WOMEN'S 7-DAY TRIAL",
      title: "Women's Wellness Program™",
      tagline: "REAL STRUCTURE. REAL SUPPORT. REAL PROGRESS.",
      desc: [
        "Designed for women seeking structured fitness, nutritional support, and a wellness-first approach.",
      ],
      features: [
        "Flexible workout structure (home or gym)",
        "Built-in accountability and support",
        "Nutrition guidance without restriction",
        "Designed for real schedules and real life",
        "Progress you can sustain",
      ],
      cta: "Explore WWP",
      featured: true,
      image: "/images/programs/bigronjones-61.jpg",
      // Ron (left) + client (right) both have their faces in the top of the
      // frame, so anchor the crop to the top to keep both visible.
      imagePosition: "object-top",
      href: "/programs/trial",
    },
  ],
  about: {
    eyebrow: "MEET BIGRONJONES",
    headline: ["REAL COACHING.", "REAL RESULTS."],
    bio1:
      "BigRonJones has spent over 20 years helping real people cut through the noise of fitness culture and actually move the needle on their health.",
    bio2:
      "No gimmicks, no unachievable standards. Whether you're a working dad trying to get back in shape, a mom rebuilding her wellness, or anyone ready to stop settling — BigRon's programs meet you exactly where you are.",
    quote:
      "No perfect life required. Show up, stay consistent, and the progress follows.",
    tags: ["Practical Methods", "Real-World Goals", "Proven Results"],
    cta: "Book a Consultation",
    image: "/images/ron/mentality-portrait.jpg",
  },
  testimonials: [
    {
      name: "Marcus T.",
      program: "Men's Alliance",
      text: "Big Ron changed how I think about fitness. It's not about perfection — it's about consistency. Down 32lbs in 4 months.",
      stars: 5,
    },
    {
      name: "Keisha M.",
      program: "Women's Wellness",
      text: "I've tried every program out there. This is the first one that felt like it was built FOR me, not some fitness model.",
      stars: 5,
    },
    {
      name: "Devon R.",
      program: "7-Day Trial → Men's Alliance",
      text: "Signed up for the trial on a whim. Enrolled in the full program after day 3. The daily check-ins alone are worth it.",
      stars: 4,
    },
    {
      name: "Alicia B.",
      program: "Women's Wellness",
      text: "I'm a mom of 3. BigRon's program works around my real life, not against it. Best decision I've made for myself.",
      stars: 5,
    },
    {
      name: "James O.",
      program: "Men's Alliance",
      text: "The community aspect sets this apart from everything else. Accountability from Ron AND the group. Game changer.",
      stars: 4.5,
    },
    {
      name: "Tanya W.",
      program: "7-Day Trial",
      text: "Was genuinely skeptical about a 7-day trial. By day 5 I had already seen a shift in my mindset. Incredible.",
      stars: 5,
    },
    {
      name: "Chris P.",
      program: "Men's Alliance",
      text: "Lost 28lbs but more importantly I built habits that actually stick. Ron keeps it real, no sugarcoating.",
      stars: 4,
    },
    {
      name: "Sandra L.",
      program: "Women's Wellness",
      text: "The accountability partner system is genius. Having someone in your corner who actually checks in changes everything.",
      stars: 5,
    },
  ],
  blog: [
    {
      tag: "NUTRITION",
      title:
        "You're Losing Weight — But Also Losing Muscle. Here's Why That Changes Everything.",
      read: "4 min read",
      slug: "losing-weight-losing-muscle",
    },
    {
      tag: "TRAINING",
      title: "Stop Treating Sleep Like A Luxury. Fix Your Structure First.",
      read: "3 min read",
      slug: "sleep-structure",
    },
    {
      tag: "MINDSET",
      title:
        "Low-Fat Diets For Everyone? The Problem Nobody Is Talking About.",
      read: "5 min read",
      slug: "low-fat-diets",
    },
  ],
  social: [
    { label: "Instagram", href: "https://instagram.com/bigronjones", icon: "Instagram" },
    { label: "YouTube", href: "https://youtube.com/@bigronjones", icon: "Youtube" },
    { label: "TikTok", href: "https://tiktok.com/@bigronjones", icon: "Music2" },
    { label: "Facebook", href: "https://facebook.com/bigronjones", icon: "Facebook" },
  ],
};

export type Program = (typeof siteData.programs)[number];
export type Testimonial = (typeof siteData.testimonials)[number];
