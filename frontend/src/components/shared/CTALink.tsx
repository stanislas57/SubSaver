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
 * variant="solid" : bouton plein doré (thème Luxe), pour les CTA principaux.
 * variant="ghost" : lien discret bleu nuit avec flèche, pour les CTA secondaires. */
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
        style={{ willChange: "transform" }}
        className={cn(
          "rounded-full bg-gradient-to-br from-luxury-gold to-luxury-gold-deep px-8 py-3 text-sm font-semibold text-white shadow-md transition-shadow duration-300 hover:shadow-gold",
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
      style={{ willChange: "transform" }}
      className={cn(
        "group flex items-center gap-2 text-sm font-medium text-luxury-text-light transition-colors duration-200 hover:text-luxury-gold-deep",
        className
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  );
}
