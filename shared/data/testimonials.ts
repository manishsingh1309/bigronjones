export type ProgramTestimonialFilter =
  | "All"
  | "Trial"
  | "Mens"
  | "Womens";

export type ExtendedTestimonial = {
  name: string;
  program: string;
  filter: Exclude<ProgramTestimonialFilter, "All">;
  text: string;
  stars: number;
  result?: string;
};

export const testimonials: ExtendedTestimonial[] = [
  {
    name: "Marcus T.",
    program: "Men's Alliance",
    filter: "Mens",
    text:
      "Big Ron changed how I think about fitness. It's not about perfection — it's about consistency. Down 32lbs in 4 months.",
    stars: 5,
    result: "-32 lbs",
  },
  {
    name: "Keisha M.",
    program: "Women's Wellness",
    filter: "Womens",
    text:
      "I've tried every program out there. This is the first one that felt like it was built FOR me, not some fitness model.",
    stars: 5,
  },
  {
    name: "Devon R.",
    program: "7-Day Trial → Men's Alliance",
    filter: "Trial",
    text:
      "Signed up for the trial on a whim. Enrolled in the full program after day 3. The daily check-ins alone are worth it.",
    stars: 5,
  },
  {
    name: "Alicia B.",
    program: "Women's Wellness",
    filter: "Womens",
    text:
      "I'm a mom of 3. BigRon's program works around my real life, not against it. Best decision I've made for myself.",
    stars: 5,
  },
  {
    name: "James O.",
    program: "Men's Alliance",
    filter: "Mens",
    text:
      "The community aspect sets this apart from everything else. Accountability from Ron AND the group. Game changer.",
    stars: 5,
  },
  {
    name: "Tanya W.",
    program: "7-Day Trial",
    filter: "Trial",
    text:
      "Was genuinely skeptical about a 7-day trial. By day 5 I had already seen a shift in my mindset. Incredible.",
    stars: 5,
  },
  {
    name: "Chris P.",
    program: "Men's Alliance",
    filter: "Mens",
    text:
      "Lost 28lbs but more importantly I built habits that actually stick. Ron keeps it real, no sugarcoating.",
    stars: 5,
    result: "-28 lbs",
  },
  {
    name: "Sandra L.",
    program: "Women's Wellness",
    filter: "Womens",
    text:
      "The accountability partner system is genius. Having someone in your corner who actually checks in changes everything.",
    stars: 5,
  },
  {
    name: "DeShawn K.",
    program: "Men's Alliance",
    filter: "Mens",
    text:
      "Two years of yo-yo dieting. One conversation with Ron flipped a switch I didn't know existed. Down 18lbs and stronger than ever.",
    stars: 5,
    result: "-18 lbs",
  },
  {
    name: "Renee J.",
    program: "Women's Wellness",
    filter: "Womens",
    text:
      "I used to think fitness was for younger me. Ron and Sean built me a plan that respects my schedule AND my body. 47 and the strongest I've ever been.",
    stars: 5,
  },
  {
    name: "Mike S.",
    program: "7-Day Trial",
    filter: "Trial",
    text:
      "Did the trial expecting another sales funnel. Got real, immediate value on day 1. Stayed because it worked.",
    stars: 5,
  },
  {
    name: "Brenda H.",
    program: "Women's Wellness",
    filter: "Womens",
    text:
      "Sean's nutrition call alone was worth the entire program. He met me where I was — no judgment, no perfection demand.",
    stars: 5,
  },
];
