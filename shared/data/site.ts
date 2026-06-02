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
    { label: "HOME", href: "/" },
    { label: "MEN'S COACHING", href: "/programs/mens" },
    { label: "WOMEN'S COACHING", href: "/programs/womens" },
    { label: "7-DAY TRIAL", href: "/programs/trial" },
    { label: "CONSULT", href: "/consult" },
    { label: "PODCAST", href: "https://podcast.bigronjones.com" },
  ],
  hero: {
    tagline: "PRIVATE ONLINE COACHING",
    sub: "ADULTS 35+ • STRUCTURED TRAINING • WEEKLY ACCOUNTABILITY",
    lines: [
      { text: "PRIVATE ONLINE", color: "white" as const },
      { text: "COACHING FOR", color: "white" as const },
      { text: "ADULTS 35+", color: "crimson" as const },
    ],
    description:
      "Training, nutrition support, and weekly accountability built for men and women who are ready to stop guessing and follow a real plan.",
    role: "Premium Strength & Wellness Coach",
    cta: "APPLY FOR COACHING",
    ctaSub: "Or start with 7 days free",
    image: "/assets/ron-hero.jpg",
  },
  stats: [
    { value: 20, suffix: "+", label: "Years Coaching" },
    { value: 2000, suffix: "+", label: "Community Members" },
    { value: 4.9, suffix: "/5", label: "Client Rating" },
    { value: 98, suffix: "%", label: "Client Retention" },
  ],
  marquee: [
    "PRIVATE ONLINE COACHING",
    "ADULTS 35+ FOCUS",
    "WEEKLY ZOOM OVERSIGHT",
    "TRAINING + NUTRITION SUPPORT",
    "20+ YEARS COACHING EXPERIENCE",
    "GYM AND HOME STRUCTURE",
    "REAL ACCOUNTABILITY",
    "BUILT FOR REAL GOALS",
  ],
  programs: [
    {
      badge: "MEN'S COACHING",
      title: "Men's Fitness Alliance™",
      tagline: "PRIVATE COACHING FOR MEN 35+",
      desc: [
        "Private coaching for men 35+ who need structure, accountability, and a sustainable plan built around real life.",
      ],
      features: [
        "Structured training plan (gym or home)",
        "Weekly private Zoom oversight",
        "Nutrition guidance that fits real life",
        "Daily accountability check-ins",
        "Built for consistency, not intensity spikes",
      ],
      cta: "APPLY FOR MEN'S COACHING",
      featured: true,
      image: "/images/programs/mens-fitness-alliance.png",
      imagePosition: "object-center",
      href: "/apply?program=mens",
    },
    {
      badge: "WOMEN'S COACHING",
      title: "Women's Wellness Program™",
      tagline: "PRIVATE COACHING FOR WOMEN 35+",
      desc: [
        "Private coaching for women 35+ who want structured training, nutrition support, and wellness oversight that fits real life.",
      ],
      features: [
        "Flexible workout structure (home or gym)",
        "Weekly private Zoom oversight",
        "Nutrition guidance without restriction",
        "Daily accountability and support",
        "Built for real schedules and real goals",
      ],
      cta: "APPLY FOR WOMEN'S COACHING",
      featured: true,
      image: "/images/programs/bigronjones-61.jpg",
      // Ron (left) + client (right) both have their faces in the top of the
      // frame, so anchor the crop to the top to keep both visible.
      imagePosition: "object-top",
      href: "/apply?program=womens",
    },
    {
      badge: "ENTRY POINT",
      title: "7-Day Oversight Trial",
      tagline: "START HERE IF YOU'RE NOT READY FOR FULL COACHING",
      desc: [
        "Start with 7 days of structure, daily tracking, training direction, and two private 1:1 Zoom calls with BigRonJones®.",
      ],
      features: [
        "7 days of structured training direction",
        "Two private 1:1 Zoom calls with BigRonJones",
        "Daily tracking and accountability",
        "Full access to the program platform",
        "No credit card required",
      ],
      cta: "START YOUR TRIAL",
      featured: true,
      image: "/images/programs/oversight-trial.png",
      imagePosition: "object-center",
      href: "/programs/trial",
    },
  ],
  about: {
    eyebrow: "MEET BIGRONJONES",
    headline: ["REAL COACHING.", "REAL RESULTS."],
    bio1: "BigRonJones has spent over 20 years helping real people cut through the noise of fitness culture and actually move the needle on their health.",
    bio2: "No gimmicks, no unachievable standards. Whether you're a working dad trying to get back in shape, a mom rebuilding her wellness, or anyone ready to stop settling — BigRon's programs meet you exactly where you are.",
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
      title: "Low-Fat Diets For Everyone? The Problem Nobody Is Talking About.",
      read: "5 min read",
      slug: "low-fat-diets",
    },
  ],
  social: [
    {
      label: "Instagram",
      href: "https://instagram.com/bigronjones",
      icon: "Instagram",
    },
    {
      label: "YouTube",
      href: "https://youtube.com/@bigronjones",
      icon: "Youtube",
    },
    {
      label: "TikTok",
      href: "https://tiktok.com/@bigronjones",
      icon: "Music2",
    },
    {
      label: "Facebook",
      href: "https://facebook.com/bigronjones",
      icon: "Facebook",
    },
  ],
};

export type Program = (typeof siteData.programs)[number];
export type Testimonial = (typeof siteData.testimonials)[number];
