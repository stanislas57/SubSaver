import type { Variants, Transition } from "framer-motion";

/** Variants et primitives d'animation partagées (Framer Motion + CSS 3D).
 * Respecte prefers-reduced-motion : chaque variant garde une version statique équivalente.
 */

const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: easeOut } satisfies Transition,
};
