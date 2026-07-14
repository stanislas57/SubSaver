import * as React from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

export interface TiltCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"> {
  children: React.ReactNode;
}

type Quick = ReturnType<typeof gsap.quickTo>;

/** Carte vitrée (glassmorphism) avec tilt 3D + glare piloté par GSAP quickTo - lissage
 * indépendant du framerate. Entrée en cascade basée sur la position parmi ses frères.
 * Désactivée automatiquement si l'utilisateur préfère moins d'animations.
 */
export function TiltCard({ children, className, ...props }: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const quick = React.useRef<{ rx: Quick; ry: Quick; scale: Quick } | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.set(el, { transformPerspective: 900 });
    quick.current = {
      rx: gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" }),
      ry: gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" }),
      scale: gsap.quickTo(el, "scale", { duration: 0.4, ease: "power2.out" }),
    };

    const index = Array.from(el.parentElement?.children ?? []).indexOf(el);
    gsap.fromTo(
      el,
      { opacity: 0, y: 24, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: index * 0.07, ease: "power3.out" }
    );
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !quick.current) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    quick.current.rx(7 - py * 14);
    quick.current.ry(px * 14 - 7);
    quick.current.scale(1.015);
    el.style.setProperty("--glare-x", `${px * 100}%`);
    el.style.setProperty("--glare-y", `${py * 100}%`);
    el.style.setProperty("--glare-o", "1");
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el || !quick.current) return;
    quick.current.rx(0);
    quick.current.ry(0);
    quick.current.scale(1);
    el.style.setProperty("--glare-o", "0");
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/15 bg-surface/60 shadow-lg backdrop-blur-xl transition-shadow duration-300 will-change-transform hover:shadow-2xl dark:border-white/10 dark:bg-white/5",
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: "var(--glare-o, 0)",
          background:
            "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(59,130,246,0.18), rgba(16,185,129,0.10) 40%, transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
