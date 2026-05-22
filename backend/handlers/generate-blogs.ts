import { GoogleGenerativeAI } from "@google/generative-ai";
import { blogStore } from "../../shared/lib/blogStore";
import { RON_VOICE_SYSTEM_PROMPT, DAILY_BLOG_TOPICS } from "../../shared/lib/ronVoice";
import { generateSlug, getReadingTime } from "../../shared/lib/blogUtils";


function getCoverImage(category: string): string {
  const map: Record<string, string> = {
    Fitness: "/images/ron/gym-curls.jpg",
    Nutrition: "/images/ron/dumbbell-side.jpg",
    Mindset: "/images/ron/mentality-portrait.jpg",
    Family: "/images/ron/pier-lifestyle.jpg",
    Recovery: "/images/ron/bike-cardio.jpg",
    Motivation: "/images/ron/gym-standing.jpg",
  };
  return map[category] || "/images/ron/gym-bench.jpg";
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, error: "GOOGLE_API_KEY not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const topics = [
      DAILY_BLOG_TOPICS[dayOfYear % DAILY_BLOG_TOPICS.length],
      DAILY_BLOG_TOPICS[(dayOfYear + 5) % DAILY_BLOG_TOPICS.length],
      DAILY_BLOG_TOPICS[(dayOfYear + 11) % DAILY_BLOG_TOPICS.length],
    ];

    const blogs = [];

    for (let i = 0; i < 3; i++) {
      const prompt = `${RON_VOICE_SYSTEM_PROMPT}

Write a complete blog post about: "${topics[i]}"

Return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:
{
  "title": "...",
  "subtitle": "...",
  "category": "...",
  "tags": ["...", "...", "..."],
  "body": "full markdown body here",
  "excerpt": "2-sentence compelling preview",
  "readingTime": "X min read",
  "challengeOfTheDay": "One specific action for the reader to take today"
}`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text();

      let blogData;
      try {
        const cleaned = rawText.replace(/```json|```/g, "").trim();
        blogData = JSON.parse(cleaned);
      } catch {
        blogData = {
          title: topics[i],
          subtitle: "Practical advice from Big Ron",
          category: "Fitness",
          tags: ["fitness", "motivation"],
          body: rawText,
          excerpt: "Ron breaks down what really works.",
          readingTime: "3 min read",
          challengeOfTheDay: "Take action today.",
        };
      }

      const blog = {
        id: `blog-${Date.now()}-${i}`,
        slug: generateSlug(blogData.title),
        title: blogData.title,
        subtitle: blogData.subtitle,
        category: blogData.category,
        tags: blogData.tags,
        body: blogData.body,
        excerpt: blogData.excerpt,
        readingTime: blogData.readingTime || getReadingTime(blogData.body),
        challengeOfTheDay: blogData.challengeOfTheDay,
        publishedAt: new Date().toISOString(),
        aiGenerated: true,
        featured: i === 0,
        coverImage: getCoverImage(blogData.category),
        author: {
          name: "Big Ron Jones",
          avatar: "/images/ron/mentality-portrait.jpg",
          title: "Fitness & Wellness Coach",
        },
      };

      blogs.push(blog);
      blogStore.addBlog(blog);
    }

    return Response.json({
      success: true,
      blogs,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Blog generation error:", error);

    const { seedBlogs } = await import("../../shared/data/seedBlogs");
    const fallbackBlogs = seedBlogs.slice(0, 3);
    return Response.json({
      success: true,
      blogs: fallbackBlogs,
      generatedAt: new Date().toISOString(),
      fallback: true,
    });
  }
}
