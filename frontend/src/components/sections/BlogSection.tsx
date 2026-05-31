import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { seedBlogs } from "@/data/seedBlogs";
import type { Blog } from "@/lib/blogStore";
import { viewportOnce } from "@/lib/animations";

export default function BlogSection() {
  // Show the latest real posts. Seed posts render instantly (no spinner) and
  // the live posts from /api/blogs replace them once loaded — same strategy
  // as the /blog listing page. On any failure we keep the seed posts.
  const [blogs, setBlogs] = useState<Blog[]>(seedBlogs);

  useEffect(() => {
    let active = true;
    fetch("/api/blogs")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Blog[]) => {
        if (active && Array.isArray(data) && data.length > 0) setBlogs(data);
      })
      .catch(() => {
        /* keep seed blogs */
      });
    return () => {
      active = false;
    };
  }, []);

  const posts = blogs.slice(0, 3);

  return (
    <section id="blog" className="bg-[#050505] py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-2xl">
            <motion.p
              variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
              className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]"
            >
              — RON'S PLAYBOOK
            </motion.p>
            <motion.h2
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
              className="font-['Bebas_Neue'] leading-[0.92] text-white"
              style={{ fontSize: "clamp(2.75rem, 8vw, 7rem)" }}
            >
              FROM RON'S<br />PLAYBOOK.
            </motion.h2>
          </div>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center border border-[#1a1a1a] px-6 py-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.2em] text-white/70 transition-colors hover:border-[#E8192C] hover:text-white"
            >
              All Articles →
            </Link>
          </motion.div>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group border border-[#1a1a1a] bg-[#0f0f0f] transition-all duration-300 hover:-translate-y-1 hover:border-[#E8192C]/30"
            >
              <Link to={`/blog/${post.slug}`} className="block p-7">
                <p className="mb-4 font-['DM_Mono'] text-[9px] uppercase tracking-[0.3em] text-[#E8192C]">
                  {post.category}
                </p>
                <h3 className="mb-6 font-['Bebas_Neue'] text-2xl leading-tight text-white transition-colors group-hover:text-[#E8192C]">
                  {post.title}
                </h3>
                <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
                  <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/30">
                    {post.readingTime}
                  </span>
                  <span className="text-base text-[#E8192C] transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
