
/**
 * Two spotlight variants:
 *  - <Spotlight /> : aceternity-style SVG gradient spotlight (absolute positioned)
 *  - <CursorSpotlight /> : ibelick-style cursor-following glow inside a card
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export function Spotlight({ className, fill = "#E8192C" }: SpotlightProps) {
  return (
    <svg
      className={cn(
        "animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_1065_8" />
        </filter>
      </defs>
    </svg>
  );
}

interface CursorSpotlightProps {
  className?: string;
  size?: number;
  color?: string;
}

export function CursorSpotlight({
  className,
  size = 300,
  color = "rgba(232, 25, 44, 0.15)",
}: CursorSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const onEnter = () => setOpacity(1);
    const onLeave = () => setOpacity(0);

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300",
        className
      )}
      style={{
        opacity,
        background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 70%)`,
      }}
    />
  );
}
