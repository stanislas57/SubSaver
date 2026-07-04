import * as React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

/** Lien de navigation de la sidebar, avec état actif géré par React Router. */
export function NavLink({ to, icon, label, end }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-white/10 text-white"
            : "text-text-sidebar hover:bg-white/5 hover:text-white"
        )
      }
    >
      {icon}
      {label}
    </RouterNavLink>
  );
}
