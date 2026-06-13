
import { Fragment } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

// Render ® / ™ as small raised superscripts so they don't render at full size
// on the baseline of a large Bebas headline (e.g. "BIGRONJONES®").
function withTrademarkMarks(text: string) {
  return text.split(/([®™])/).map((part, i) =>
    part === "®" || part === "™" ? (
      <sup
        key={i}
        style={{
          fontSize: "0.4em",
          verticalAlign: "super",
          lineHeight: 0,
          marginLeft: "0.04em",
        }}
      >
        {part}
      </sup>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

interface PageHeaderProps {
  eyebrow: string;
  headline: string[];
  sub?: string;
  align?: "left" | "center";
  size?: "md" | "lg";
}

export default function PageHeader({
  eyebrow,
  headline,
  sub,
  align = "left",
  size = "lg",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mx-auto flex max-w-[1400px] flex-col gap-5 px-6 md:px-10",
        align === "center" && "items-center text-center"
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: align === "center" ? 0 : -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-3"
      >
        <span className="h-[1px] w-8 bg-[#E8192C]" />
        <span className="font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
          {eyebrow}
        </span>
      </motion.div>

      <div>
        {headline.map((line, i) => (
          <div key={`${line}-${i}`} className="overflow-hidden">
            <motion.h1
              initial={{ y: "105%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 0.85,
                delay: 0.15 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                "font-['Bebas_Neue'] leading-[0.92]",
                i % 2 === 1 ? "text-[#E8192C]" : "text-white"
              )}
              style={{
                fontSize:
                  size === "lg"
                    ? "clamp(2.75rem, 9vw, 7.5rem)"
                    : "clamp(2.25rem, 6.5vw, 5.5rem)",
              }}
            >
              {withTrademarkMarks(line)}
            </motion.h1>
          </div>
        ))}
      </div>

      {sub && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className={cn(
            "max-w-2xl font-['DM_Sans'] text-base leading-relaxed text-white/60",
            align === "center" && "mx-auto"
          )}
        >
          {sub}
        </motion.p>
      )}
    </header>
  );
}
