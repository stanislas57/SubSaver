import * as React from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "h1" | "h2" | "p";
}

/** Révélation de texte façon Apple : masque overflow-hidden sur le conteneur,
 * translation verticale (bas -> haut) déclenchée par le scroll (ScrollTrigger),
 * jamais au chargement global de la page. Désactivée si prefers-reduced-motion. */
export function RevealText({ children, className, as: Tag = "div" }: RevealTextProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // will-change force l'accélération matérielle le temps de l'animation
    inner.style.willChange = "transform";
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: wrapRef.current, start: "top 85%" },
          onComplete: () => {
            inner.style.willChange = "auto";
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="overflow-hidden">
      {/* Tag est polymorphe (div/h1/h2/p) : TS ne peut pas unifier le type de ref
       * par branche, d'où ce cast ciblé (innerRef n'est lu que comme HTMLElement générique). */}
      <Tag ref={innerRef as React.RefObject<HTMLDivElement>} className={className}>
        {children}
      </Tag>
    </div>
  );
}
