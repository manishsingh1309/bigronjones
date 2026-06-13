export type ProductCategory = "program" | "consult" | "training";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: ProductCategory;
  badge?: string;
  description: string;
  fullDescription: string;
  features: string[];
  image: string;
  coach: string;
  duration?: string;
  cta: string;
};

export const products: Product[] = [
  {
    id: "band-workout",
    slug: "band-powered-workout",
    name: "Band Powered Workout (with bands)",
    price: 99.0,
    category: "training",
    badge: "INCLUDES EQUIPMENT",
    description:
      "Complete resistance band training program with bands included. Build real strength anywhere.",
    fullDescription:
      "Everything you need to train effectively with zero excuses. Ron's signature band-powered workout system ships directly to you — complete program with the actual bands. No gym required. No more 'I don't have equipment.' Just results.",
    features: [
      "Full resistance band set included",
      "Complete workout programming by Ron",
      "Video demonstration library",
      "Beginner through advanced progressions",
      "Works from home, hotel, or gym",
      "Lifetime program access",
    ],
    image: "/images/ron/band-training.jpg",
    coach: "Big Ron Jones",
    cta: "Get the Program",
  },
  {
    id: "pediatrics",
    slug: "pediatrics-program",
    name: "PEDIATRICS PROGRAM",
    price: 47.0,
    category: "program",
    badge: "FAMILIES",
    description:
      "Teaching kids healthy habits early. Real fitness for real kids — no fluff, no fad diets.",
    fullDescription:
      "Big Ron's pediatrics program is designed for parents who want to raise healthy, active kids without the overwhelm. Evidence-based, fun, and built for real family life — not a perfect one.",
    features: [
      "Age-appropriate fitness programming",
      "Parent guidance & accountability",
      "Nutrition basics for kids",
      "Fun movement activities",
      "Monthly check-in structure",
      "Family-oriented approach",
    ],
    image: "/images/ron/coaching-session.jpg",
    coach: "Big Ron Jones",
    cta: "Join the Program",
  },
  {
    id: "coaching-call",
    slug: "private-coaching-call",
    name: "Private Coaching Call with BigRonJones",
    price: 79.99,
    category: "consult",
    badge: "1-ON-1 SESSION",
    description:
      "60 minutes directly with BigRonJones. Your goals, your obstacles, your custom plan.",
    fullDescription:
      "Stop guessing. In one session with BigRonJones, you'll get crystal clarity on what's holding you back and a direct plan to fix it. This is not a generic consultation — BigRonJones will know your story and give you real, specific next steps before the call ends.",
    features: [
      "60-minute private session with BigRonJones",
      "Custom assessment of your current routine",
      "Personalized action plan",
      "Direct Q&A — no topic off limits",
      "Follow-up summary sent after call",
      "Discounted rate on programs after consult",
    ],
    image: "/images/consult/coaching-call-ron.jpg",
    coach: "BigRonJones",
    duration: "60 minutes",
    cta: "Book with BigRonJones",
  },
  {
    id: "nutrition-call",
    slug: "private-nutrition-call",
    name: "Private Nutrition Call with Sean",
    price: 79.99,
    category: "consult",
    badge: "NUTRITION EXPERT",
    description:
      "One-on-one with Sean, BigRonJones' in-house nutritionist. Real food plans for real people.",
    fullDescription:
      "Sean isn't here to sell you supplements or put you on a diet you can't sustain. In this private session, you'll get a nutrition strategy built around your actual life — your schedule, your food preferences, your goals.",
    features: [
      "60-minute private nutrition consultation",
      "Custom nutrition plan for your goals",
      "Meal structure & timing guidance",
      "Supplement review (what you need vs. don't)",
      "Practical grocery & meal prep tips",
      "30-day check-in included",
    ],
    image: "/images/team/sean.png",
    coach: "Sean",
    duration: "60 minutes",
    cta: "Book with Sean",
  },
];

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const getRelatedProducts = (slug: string, limit = 3): Product[] =>
  products.filter((p) => p.slug !== slug).slice(0, limit);
