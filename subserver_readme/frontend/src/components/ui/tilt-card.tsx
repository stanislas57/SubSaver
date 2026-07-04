import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TiltCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"> {
  children: React.ReactNode;
}

/** Carte interactive avec léger tilt 3D et reflet suivant le curseur — signature visuelle
 * de l'app (clin d'œil à la carte bancaire, cohérent avec un gestionnaire d'abonnements/banque).
 * Désactivé automatiquement si l'utilisateur préfère moins d'animations.
 */
export function TiltCard({ children, className, ...props }: TiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(springY, [0, 1], [7, -7]);
  const rotateY = useTransform(springX, [0, 1], [-7, 7]);
  const sheenX = useTransform(springX, [0, 1], [0, 100]);
  const sheenY = useTransform(springY, [0, 1], [0, 100]);
  const sheenBackground = useTransform(
    [sheenX, sheenY],
    ([x, y]: number[]) => `radial-gradient(circle at ${x}% ${y}%, rgba(59,130,246,0.14), rgba(16,185,129,0.08) 40%, transparent 70%)`
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  if (prefersReducedMotion) {
    return (
      <div className={cn("rounded-lg border border-border bg-surface shadow-sm", className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 800 }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow duration-200 will-change-transform hover:shadow-lg",
        className
      )}
      {...props}
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: sheenBackground }} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
