import * as React from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export interface BentoTileProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Tuile "Bento Box" (thème Luxe : carte blanche, fine bordure bleu nuit,
 * ombre douce) qui apparaît en fondu/translation dès qu'elle entre dans le
 * viewport (ScrollTrigger), pas au chargement global. */
export function BentoTile({ children, className, style, ...props }: BentoTileProps) {
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
          onComplete: () => {
            // Libère la couche GPU une fois l'animation jouée
            el.style.willChange = "auto";
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      // will-change force l'accélération matérielle pendant l'animation GSAP
      style={{ willChange: "transform, opacity", ...style }}
      className={cn(
        "rounded-3xl border border-slate-900/10 bg-luxury-card p-8 shadow-md transition-shadow duration-300 hover:shadow-luxury-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
