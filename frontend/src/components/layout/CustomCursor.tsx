
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  const springX = useSpring(x, { stiffness: 250, damping: 24, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 250, damping: 24, mass: 0.5 });

  useEffect(() => {
    const hasHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!hasHover) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX - 10);
      y.set(e.clientY - 10);
      dotX.set(e.clientX - 3);
      dotY.set(e.clientY - 3);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest("a, button, [role='button'], input, textarea, select");
      setHovering(Boolean(interactive));
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [x, y, dotX, dotY]);

  if (!enabled) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-5 w-5 rounded-full border mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          borderColor: hovering ? "#E8192C" : "#ffffff",
          opacity: hovering ? 0.6 : 1,
          scale: hovering ? 2.6 : 1,
          backgroundColor: hovering ? "rgba(232,25,44,0.15)" : "transparent",
          transition: "border-color .2s, background-color .2s, scale .2s, opacity .2s",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-[6px] w-[6px] rounded-full bg-white"
        style={{ x: dotX, y: dotY }}
      />
    </>
  );
}
