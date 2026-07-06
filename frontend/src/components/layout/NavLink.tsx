import * as React from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMagnetic } from "@/hooks/useMagnetic";

export interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

/** Lien de navigation de la sidebar. L'état actif est surligné par une pilule
 * qui glisse d'un lien à l'autre (layoutId partagé), plutôt qu'un simple changement de fond.
 * Effet magnétique subtil : le lien suit légèrement le curseur au survol. */
export function NavLink({ to, icon, label, end }: NavLinkProps) {
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const magneticRef = useMagnetic<HTMLAnchorElement>(0.25, 8);

  return (
    <RouterNavLink
      ref={magneticRef}
      to={to}
      end={end}
      className={cn(
        "relative flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
        isActive ? "text-white" : "text-text-sidebar hover:bg-white/5 hover:text-white"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl border border-white/10 bg-white/10 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.5)] backdrop-blur-sm"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative flex items-center gap-3.5">
        {icon}
        {label}
      </span>
    </RouterNavLink>
  );
}
