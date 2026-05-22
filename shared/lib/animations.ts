import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

export const clipReveal: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0 },
  visible: (i: number = 0) => ({
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 },
  }),
};

export const lineRise: Variants = {
  hidden: { y: "110%" },
  visible: (i: number = 0) => ({
    y: "0%",
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.5 + i * 0.12 },
  }),
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const viewportOnce = { once: true, margin: "-100px" } as const;

export function getReducedVariants(isMobile: boolean): Variants {
  if (isMobile) {
    return {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };
}
