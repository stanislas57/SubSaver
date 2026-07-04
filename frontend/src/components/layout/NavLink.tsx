import * as React from "react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

/** Lien de navigation de la sidebar. L'état actif est surligné par une pilule
 * qui glisse d'un lien à l'autre (layoutId partagé), plutôt qu'un simple changement de fond. */
export function NavLink({ to, icon, label, end }: NavLinkProps) {
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <RouterNavLink
      to={to}
      end={end}
      className={cn(
        "relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
        isActive ? "text-white" : "text-text-sidebar hover:bg-white/5 hover:text-white"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-sm bg-white/10"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <span className="relative flex items-center gap-3">
        {icon}
        {label}
      </span>
    </RouterNavLink>
  );
}
