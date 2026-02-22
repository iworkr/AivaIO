import type { Variants, Transition } from "framer-motion";

const linearEase = [0.16, 1, 0.3, 1] as const;

export const linearFadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [...linearEase] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [...linearEase] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [...linearEase] },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [...linearEase] },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [...linearEase] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const pageTransition: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [...linearEase] },
  },
  exit: {
    opacity: 0,
    x: -40,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

export const hoverBrighten = {
  whileHover: { opacity: 1 },
  initial: { opacity: 0.6 },
  transition: { duration: 0.15, ease: "easeOut" } as Transition,
};

export const tapScale = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 } as Transition,
};

export const viewportOnce = { once: true, margin: "-64px" as `${number}px` };
