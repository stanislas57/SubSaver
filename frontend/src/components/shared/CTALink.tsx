import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useMagnetic } from "@/hooks/useMagnetic";
import { cn } from "@/lib/utils";

export interface CTALinkProps {
  /** Route interne (react-router). Ignoré si `onClick` est fourni. */
  to?: string;
  /** Action personnalisée (ex: ouvrir un lien externe). Prioritaire sur `to`. */
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
}

/** Lien d'action inter-pages avec effet magnétique + glow au survol.
 * variant="solid" : bouton plein (blanc sur noir), pour les CTA principaux.
 * variant="ghost" : lien discret avec flèche, pour les CTA secondaires. */
export function CTALink({ to, onClick, children, variant = "ghost", className }: CTALinkProps) {
  const navigate = useNavigate();
  const magneticRef = useMagnetic<HTMLButtonElement>(0.3, 12);

  function handleClick() {
    if (onClick) onClick();
    else if (to) navigate(to);
  }

  if (variant === "solid") {
    return (
      <button
        ref={magneticRef}
        onClick={handleClick}
        className={cn(
          "rounded-full bg-white px-8 py-3 text-sm font-semibold text-black shadow-[0_0_0_0_rgba(255,255,255,0)] transition-shadow duration-300 hover:shadow-[0_0_40px_4px_rgba(255,255,255,0.25)]",
          className
        )}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      ref={magneticRef}
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:text-white",
        className
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  );
}
