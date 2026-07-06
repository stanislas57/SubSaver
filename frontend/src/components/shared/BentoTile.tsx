import * as React from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export interface BentoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Tuile "Bento Box" (glassmorphism sombre) qui apparaît en fondu/translation
 * dès qu'elle entre dans le viewport (ScrollTrigger), pas au chargement global. */
export function BentoTile({ children, className, ...props }: BentoTileProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.08]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
