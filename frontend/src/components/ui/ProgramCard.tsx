
import { motion } from "framer-motion";

import GoldButton from "./GoldButton";

interface ProgramCardProps {
  image: string;
  badge?: string;
  title: string;
  description: string;
  price: string;
  priceNote?: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
}

export default function ProgramCard({
  image,
  badge,
  title,
  description,
  price,
  priceNote,
  features,
  ctaText,
  ctaLink,
}: ProgramCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#111827] to-[#0b1220] transition-all duration-300 hover:scale-[1.02] hover:border-brand-blue/40 hover:shadow-2xl hover:shadow-brand-blue/10"
    >
      <div className="relative h-52 overflow-hidden">
        <img src={image} alt={title} className="object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-brand-black/25 to-transparent" />
        {badge && (
          <span className="absolute right-0 top-0 rounded-bl-xl bg-brand-red px-3 py-1 text-xs font-bold text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-2xl tracking-wide text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-400 font-body">{description}</p>

        <ul className="mt-4 space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300 font-body">
              <span className="mt-0.5 text-brand-blue">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6">
          <div className="mb-4">
            <span className="font-heading text-3xl text-brand-red">
              {price}
            </span>
            {priceNote && (
              <span className="ml-2 text-sm text-brand-gray font-body">
                {priceNote}
              </span>
            )}
          </div>
          <GoldButton href={ctaLink} fullWidth>
            {ctaText}
          </GoldButton>
        </div>
      </div>
    </motion.div>
  );
}
