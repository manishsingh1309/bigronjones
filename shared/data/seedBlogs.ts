import type { Blog } from "@/lib/blogStore";

const author = {
  name: "Big Ron Jones",
  avatar:
    "/images/ron/mentality-portrait.jpg",
  title: "Fitness & Wellness Coach",
};

const today = new Date();
function daysAgo(n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  d.setHours(6, 0, 0, 0);
  return d.toISOString();
}

export const seedBlogs: Blog[] = [
  {
    id: "seed-1",
    slug: "the-15-minute-rule-that-changed-everything",
    title: "The 15-Minute Rule That Changed Everything",
    subtitle:
      "Why you don't need more time — you need a different approach",
    category: "Fitness",
    tags: ["fitness", "habits", "beginner", "motivation"],
    excerpt:
      "Everyone says they don't have time to work out. I call BS — and here's the proof. 15 minutes a day is all you need to start changing your life.",
    body: `Let me be straight with you — if you have time to scroll your phone for 20 minutes, you have time to train.

I hear it every single week. "Ron, I just don't have the time." And I get it. You're working. You've got kids. You're exhausted by 7 PM. But here's the thing — you don't need an hour. You don't even need 30 minutes.

## The 15-Minute Shift

One of my clients, Marcus, came to me working 60-hour weeks with two kids under 5. He told me he literally had zero time. So I gave him one rule: 15 minutes a day. That's it. No gym required. No special equipment. Just 15 minutes of intentional movement.

The first week he did push-ups in his garage while his kids played. The second week he added resistance bands. By week four, he was waking up 15 minutes earlier because he WANTED to — not because I told him to.

## Why It Works

Here's why 15 minutes is so powerful. It removes the biggest barrier — the mental one. When you tell yourself you need an hour, your brain says "nah, not today." But 15 minutes? Your brain can't argue with that.

It also builds the habit FIRST. Most people try to build the perfect workout before they've built the habit of showing up. That's backwards. Show up for 15 minutes. Make it easy. Make it automatic.

## Stop Waiting for Perfect

The best workout program in the world means NOTHING if you don't do it. A "bad" 15-minute session beats a perfect plan you never start. Every single time.

I've watched hundreds of people transform their bodies. Not one of them started with a perfect plan. They started with showing up.

## Ron's Challenge

Here's what I want you to do RIGHT NOW. Set a timer for 15 minutes. Do push-ups, squats, lunges, whatever you can. Doesn't matter what it is. Just move for 15 minutes. Tomorrow, do it again. That's how it starts.`,
    readingTime: "3 min read",
    challengeOfTheDay:
      "Do 15 minutes of movement RIGHT NOW. Doesn't matter what it is. Just move.",
    publishedAt: daysAgo(0),
    aiGenerated: false,
    featured: true,
    coverImage:
      "/images/ron/gym-curls.jpg",
    author,
  },
  {
    id: "seed-2",
    slug: "stop-eating-clean-start-eating-smart",
    title: "Stop Eating Clean — Start Eating Smart",
    subtitle:
      "Clean eating is a myth that keeps you stuck. Here's what actually works for nutrition.",
    category: "Nutrition",
    tags: ["nutrition", "habits", "beginner", "wellness"],
    excerpt:
      "The whole 'clean eating' thing has people terrified of normal food. Ron breaks down what actually matters when it comes to fueling your body right.",
    body: `Real talk — the fitness industry has made eating WAY more complicated than it needs to be.

Every week someone asks me about "clean eating." They want to know which foods are clean and which are dirty. And I always tell them the same thing: your food isn't dirty. It's just food. Stop moralizing your meals.

## The Problem with "Clean Eating"

Here's what I've seen happen a hundred times. Someone decides to eat clean. They cut out everything they enjoy. They survive on chicken, rice, and broccoli for two weeks. Then they snap and eat an entire pizza on a Friday night. Then they feel guilty. Then they quit.

Sound familiar? That cycle isn't a you problem. It's a strategy problem.

## What Actually Works

I tell all my clients the same thing: eat mostly whole foods, get enough protein, and stop stressing about the rest. That's it. That's the secret.

One of my women's wellness members, Keisha, was so stressed about her diet that eating had become miserable. I told her to focus on just two things: protein at every meal and vegetables twice a day. Everything else? Eat what you enjoy. In 60 days she lost 14 pounds and told me she actually enjoys eating again.

## The 80/20 Rule

Aim for 80% solid nutrition choices and 20% whatever you want. Have the birthday cake. Enjoy dinner out with your family. Just make sure most of your meals are doing work for your body.

The people who get REAL results are the ones who find a way to eat well that they can actually live with. Not for 30 days — for life.

## Ron's Challenge

Today, I want you to eat one meal with a solid protein source and a vegetable. That's it. Don't overhaul your whole diet. Just nail that one meal. Do it again tomorrow. Stack the wins.`,
    readingTime: "3 min read",
    challengeOfTheDay:
      "Eat one meal today with a solid protein source and a vegetable. Just one. Stack the wins.",
    publishedAt: daysAgo(0),
    aiGenerated: false,
    featured: false,
    coverImage:
      "/images/ron/dumbbell-side.jpg",
    author,
  },
  {
    id: "seed-3",
    slug: "your-mindset-is-the-real-weight-youre-carrying",
    title: "Your Mindset Is the Real Weight You're Carrying",
    subtitle:
      "Before you fix your body, you need to fix what's going on between your ears.",
    category: "Mindset",
    tags: ["mindset", "motivation", "habits", "wellness"],
    excerpt:
      "Ron talks about the invisible weight most people carry — self-doubt, perfectionism, and the stories they tell themselves about who they are.",
    body: `I'm going to say something that might surprise you coming from a fitness coach. The biggest thing holding you back isn't your body. It's your head.

I've trained people who were 100 pounds overweight and hit their goals. I've also trained people who only needed to lose 15 pounds and couldn't get there. The difference? Mindset. Every single time.

## The Stories You Tell Yourself

Here's the thing about self-talk — it's either building you up or tearing you down. There's no neutral. And most people have been telling themselves the same story for years: "I'm not disciplined enough." "I always quit." "This won't work for me."

Those aren't facts. They're habits. And habits can be changed.

## Rewriting the Script

One of my guys, James, came in telling me he was "not a gym person." His exact words. Six months later, he texts me from the gym at 6 AM on a Saturday. You know what changed? Not his workout plan. His identity.

We started small. Instead of "I need to lose weight," we switched it to "I'm someone who takes care of himself." That's not just words — that's a completely different operating system.

## Progress Over Perfection

Stop waiting to feel motivated. Motivation is a visitor — it shows up when it wants to and leaves without warning. What you need is identity. You need to see yourself as someone who shows up regardless.

Miss a workout? That's fine. ONE missed workout doesn't define you. What defines you is what you do NEXT. Get back in there.

## Ron's Challenge

Today, write down one negative story you tell yourself about fitness. Then rewrite it. "I always quit" becomes "I'm learning to be consistent." Put it on your mirror. Read it every morning. That's where the real transformation starts.`,
    readingTime: "3 min read",
    challengeOfTheDay:
      "Write down one negative fitness story you tell yourself. Rewrite it as a positive identity statement. Put it on your mirror.",
    publishedAt: daysAgo(0),
    aiGenerated: false,
    featured: false,
    coverImage:
      "/images/ron/hoodie-outdoor.jpg",
    author,
  },
  {
    id: "seed-4",
    slug: "how-to-get-your-kids-moving-without-the-fight",
    title: "How to Get Your Kids Moving Without the Fight",
    subtitle:
      "Making fitness fun for your family doesn't have to be a battle.",
    category: "Family",
    tags: ["family", "fitness", "beginner", "wellness"],
    excerpt:
      "Ron shares practical tips for parents who want their kids to be active without turning it into a chore or a power struggle.",
    body: `If you're trying to get your kids to exercise and it feels like pulling teeth, I need you to hear this — you're doing it wrong. And that's okay, because almost every parent makes this mistake.

The problem isn't your kids. The problem is the word "exercise." Kids don't want to exercise. They want to PLAY. And there's a massive difference.

## Make It a Game, Not a Chore

I see parents telling their kids "go do 20 jumping jacks." Of course the kid doesn't want to do that. That's boring. Instead, try this: "Let's see who can do the most jumping jacks in 30 seconds." Now it's a competition. Now it's fun. Now they're begging for round two.

My pediatrics program is built entirely on this principle. Every single activity is designed to feel like play. The kids don't even realize they're working out.

## Lead by Example

Here's the real talk part. If you're sitting on the couch telling your kids to go be active, they see right through it. Kids copy what they SEE, not what they hear.

One of the best things you can do is work out where your kids can see you. Don't explain it. Don't lecture. Just let them watch. I've had so many parents tell me their kids started asking to join in after just watching for a week or two.

## Start Stupid Small

Don't try to get your kids doing 30-minute workouts. Start with 5 minutes. A family walk after dinner. A dance party in the living room. Bike rides on Saturday morning. The goal is to connect movement with FUN, not obligation.

When movement becomes something your family does together — not something you force — everything changes.

## Ron's Challenge

Tonight after dinner, take your family on a 10-minute walk. No phones. Just walk and talk. If you don't have kids, call a friend and walk while you catch up. Movement doesn't have to be complicated.`,
    readingTime: "3 min read",
    challengeOfTheDay:
      "Take your family on a 10-minute walk after dinner tonight. No phones. Just walk and talk.",
    publishedAt: daysAgo(1),
    aiGenerated: false,
    featured: false,
    coverImage:
      "/images/ron/pier-lifestyle.jpg",
    author,
  },
  {
    id: "seed-5",
    slug: "recovery-is-training-and-youre-skipping-it",
    title: "Recovery Is Training — And You're Skipping It",
    subtitle:
      "If you're not recovering, you're not growing. Period.",
    category: "Recovery",
    tags: ["recovery", "fitness", "habits", "wellness"],
    excerpt:
      "Most people think rest days are lazy days. Ron explains why recovery is the secret weapon his best clients use to actually see results.",
    body: `Let me ask you something. When was the last time you took a real rest day without feeling guilty about it? If you had to think about it, we need to talk.

I used to be the same way. Early in my coaching career, I thought more was always better. More sets, more reps, more days in the gym. And you know what I got? Burned out clients with nagging injuries who eventually quit.

## The Recovery Revolution

Here's what changed my whole philosophy. I started paying attention to which clients actually got the BEST results. And it wasn't the ones training 6 days a week. It was the ones training 4 days and recovering properly on the other 3.

Your muscles don't grow in the gym. They grow when you rest. That's not my opinion — that's biology. Every time you train, you create tiny tears in your muscle fibers. Recovery is when your body repairs and builds them back stronger.

## What Real Recovery Looks Like

Recovery isn't just sitting on the couch. Here's what I tell my clients:

Sleep 7-8 hours. This is NON-NEGOTIABLE. I don't care how busy you are. Sleep is when growth hormone peaks. Cutting sleep is cutting your results.

Hydrate. Most of my clients are walking around mildly dehydrated and wondering why they feel like garbage. Drink water. A lot of it.

Move lightly. A walk, some stretching, foam rolling. Active recovery beats complete inactivity.

## Stop Glorifying the Grind

Social media has you thinking you need to be sore and exhausted every day to be making progress. That's not discipline — that's self-destruction. Smart training beats hard training every single time.

## Ron's Challenge

Take tomorrow as a real recovery day. Sleep 8 hours tonight. Drink a gallon of water tomorrow. Do 15 minutes of stretching or a light walk. That's it. Your body will thank you.`,
    readingTime: "3 min read",
    challengeOfTheDay:
      "Sleep 8 hours tonight. Drink a gallon of water tomorrow. Do 15 minutes of stretching. That's real recovery.",
    publishedAt: daysAgo(2),
    aiGenerated: false,
    featured: false,
    coverImage:
      "/images/ron/cable-workout.jpg",
    author,
  },
  {
    id: "seed-6",
    slug: "stop-waiting-for-monday-to-start",
    title: "Stop Waiting for Monday to Start",
    subtitle:
      "The perfect time to start was yesterday. The next best time is right now.",
    category: "Motivation",
    tags: ["motivation", "mindset", "beginner", "habits"],
    excerpt:
      "Ron delivers a wake-up call to everyone who keeps pushing their start date. Spoiler: there is no perfect time, and that's exactly the point.",
    body: `I need to have a real talk moment with you. If you're reading this thinking "I'll start next week" or "I'll get serious in January" — stop. Just stop.

There is no perfect Monday. There is no perfect month. There is no magical day when your schedule clears up, your motivation appears, and everything aligns perfectly. That day doesn't exist. I've been coaching for over 5 years and not ONE person has ever told me "I'm glad I waited."

## The Waiting Trap

Here's what waiting really is. It's fear wearing a productivity costume. You're not waiting for the right time — you're avoiding the discomfort of starting. And I get it. Starting is the hardest part. But you know what's harder? Looking back in a year and realizing you're in the exact same place.

## What Starting Actually Looks Like

Starting doesn't mean overhauling your life overnight. One of my most successful clients, Derek, started by doing 10 push-ups before his morning shower. That was it. Day one. Ten push-ups.

Six months later, he'd lost 30 pounds and was training 4 days a week. But it all started with those 10 push-ups on a random Wednesday. Not a Monday. Not January 1st. A Wednesday.

## The Compound Effect

Every day you wait is a day of progress you'll never get back. But every day you show up — even if it's small — compounds. Ten push-ups becomes 20. A walk becomes a jog. A jog becomes a run. But NONE of it happens if you keep waiting.

I've said it before and I'll say it again: this is what works. Start messy. Start small. Start scared. Just START.

## Ron's Challenge

Whatever you've been putting off — do one small piece of it TODAY. Not tomorrow. Not Monday. Today. Send me a DM on Instagram @bigronjones and tell me what you did. I want to hear about it.`,
    readingTime: "3 min read",
    challengeOfTheDay:
      "Do one small piece of whatever you've been putting off — TODAY. Not tomorrow. Right now.",
    publishedAt: daysAgo(3),
    aiGenerated: false,
    featured: false,
    coverImage:
      "/images/ron/gym-standing.jpg",
    author,
  },
];
