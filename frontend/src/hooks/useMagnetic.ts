import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Attire l'élément vers le curseur dans un rayon limité (effet magnétique),
 * puis le relâche avec un easing élastique. Désactivé si prefers-reduced-motion. */
export function useMagnetic<T extends HTMLElement>(strength = 0.3, maxOffset = 10) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el: T = node;

    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    function handleMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      x(gsap.utils.clamp(-maxOffset, maxOffset, relX * strength));
      y(gsap.utils.clamp(-maxOffset, maxOffset, relY * strength));
    }

    function handleLeave() {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    }

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [strength, maxOffset]);

  return ref;
}
