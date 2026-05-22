
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { siteData } from "@/data/site";

function useCountUp(target: number, duration = 1600, start: boolean) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;
    const t0 = performance.now();
    const isFloat = !Number.isInteger(target);

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = target * eased;
      setValue(isFloat ? Math.round(next * 10) / 10 : Math.floor(next));
      if (p < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, start]);

  return value;
}

function StatItem({
  value,
  suffix,
  label,
  start,
}: {
  value: number;
  suffix: string;
  label: string;
  start: boolean;
}) {
  const v = useCountUp(value, 1600, start);
  const display = Number.isInteger(value) ? v.toLocaleString() : v.toFixed(1);
  return (
    <div className="flex flex-col items-start px-6 py-6 md:items-center md:px-10">
      <div className="font-['Bebas_Neue'] text-[48px] leading-none text-[#E8192C] md:text-[64px]">
        {display}
        <span className="text-[#E8192C]">{suffix}</span>
      </div>
      <div className="mt-3 font-['DM_Mono'] text-[11px] uppercase tracking-[0.25em] text-white/40">
        {label}
      </div>
    </div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="border-b border-[#1a1a1a] bg-[#0f0f0f] py-14">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto grid max-w-[1400px] grid-cols-2 gap-0 px-6 md:grid-cols-4 md:px-10 md:divide-x md:divide-[#1a1a1a]"
      >
        {siteData.stats.map((s) => (
          <StatItem
            key={s.label}
            value={s.value}
            suffix={s.suffix}
            label={s.label}
            start={inView}
          />
        ))}
      </motion.div>
    </section>
  );
}
