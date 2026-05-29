
import { motion } from "framer-motion";

import { Play, Youtube } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";
import GoldButton from "../ui/GoldButton";
import BrandName from "../shared/BrandName";

const videos = [
  {
    title: "Why Most Fitness Programs FAIL (And What Actually Works)",
    image: "/images/ron/barbell-curls.jpg",
    views: "12K views",
  },
  {
    title: "The 10-Minute Morning Routine That Changed My Life",
    image: "/images/ron/stairmaster.jpg",
    views: "8.5K views",
  },
  {
    title: "Band Training vs Free Weights — Which Is BETTER?",
    image: "/images/ron/band-training.jpg",
    views: "15K views",
  },
];

export default function YouTubeSection() {
  return (
    <section className="bg-brand-black py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Free Content"
          title="Learn Before You Commit"
          subtitle="Ron drops free fitness and wellness advice every week. Subscribe to the channel and start winning for free."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {videos.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#111827] transition-all duration-300 hover:border-brand-red/30"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={v.image} alt={v.title} loading="lazy" decoding="async" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/50">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 transition-transform group-hover:scale-110">
                    <Play size={24} className="ml-1 text-brand-red" fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white font-body text-sm leading-snug">
                  {v.title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <Youtube size={14} className="text-brand-red" />
                  <span className="text-xs text-brand-red font-body">
                    <BrandName />
                  </span>
                  <span className="text-xs text-brand-gray font-body">
                    • {v.views}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <GoldButton
            href="https://www.youtube.com/@bigronjones"
            className="gap-2 bg-brand-red hover:bg-brand-red-light text-white"
          >
            <Youtube size={20} />
            SUBSCRIBE ON YOUTUBE
          </GoldButton>
        </div>
      </div>
    </section>
  );
}
