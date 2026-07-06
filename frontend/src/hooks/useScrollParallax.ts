import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Fait dériver l'élément entre +distance et -distance pendant qu'il traverse
 * le viewport du conteneur scrollable le plus proche (scroll narratif, effet
 * de profondeur). Désactivé si prefers-reduced-motion. */
export function useScrollParallax<T extends HTMLElement>(distance = 24) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scroller = el.closest("main") ?? undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: distance },
        {
          y: -distance,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: el,
            scroller,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        }
      );
    });

    return () => ctx.revert();
  }, [distance]);

  return ref;
}
