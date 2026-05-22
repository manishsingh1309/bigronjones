
import { useEffect, useState, useRef } from "react";
import { useInView } from "framer-motion";

interface StatCounterProps {
  target: number;
  suffix?: string;
  label: string;
  decimals?: number;
}

export default function StatCounter({
  target,
  suffix = "",
  label,
  decimals = 0,
}: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const steps = 60;
    
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(current);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [isInView, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-5xl text-brand-gold md:text-6xl">
        {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
        {suffix}
      </div>
      <p className="mt-2 text-sm text-brand-gray font-body">{label}</p>
    </div>
  );
}
