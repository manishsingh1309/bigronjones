
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: SectionHeaderProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`mb-16 ${align === "center" ? "text-center" : "text-left"}`}
    >
      <div className={`mb-4 flex items-center gap-3 ${align === "center" ? "justify-center" : "justify-start"}`}>
        <span className="h-px w-10 bg-brand-blue" />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-red font-body">
          {eyebrow}
        </p>
        <span className="h-px w-10 bg-brand-red" />
      </div>
      <h2 className="font-heading text-4xl uppercase tracking-wider text-white md:text-6xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-gray font-body">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
