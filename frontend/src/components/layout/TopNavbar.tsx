import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { to: "/overview", label: "Vue d'ensemble" },
  { to: "/subscriptions", label: "Abonnements" },
  { to: "/analytics", label: "Analytique" },
  { to: "/calendar", label: "Calendrier" },
  { to: "/bank-connect", label: "Banque" },
  { to: "/premium", label: "Premium" },
];

/** Thème clair et luxueux : barre de navigation supérieure avec logo SubServer,
 * fond blanc semi-transparent et accent subtil. */
export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-luxury-text/10 bg-white/60 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <button onClick={() => navigate("/overview")} className="flex items-center gap-3">
          <img src="/logo.png" alt="SubServer" className="h-8 w-auto" />
          <span className="text-sm font-bold tracking-tight text-luxury-sapphire hidden sm:inline">SubServer</span>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-luxury-sapphire font-semibold" : "text-luxury-text-light hover:text-luxury-sapphire"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-luxury-sapphire/10 text-xs font-bold text-luxury-sapphire transition-colors duration-200 hover:bg-luxury-sapphire/20"
          >
            {user?.first_name?.charAt(0).toUpperCase() ?? "?"}
          </button>
          <button
            onClick={logout}
            className="rounded-lg border border-luxury-text/20 bg-luxury-text/5 p-2 text-luxury-text-light transition-colors duration-200 hover:bg-luxury-text/10 hover:text-luxury-text"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
