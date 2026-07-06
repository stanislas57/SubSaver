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

/** Barre de navigation en Bleu Nuit plein : crée un contraste saisissant avec
 * le fond clair du contenu. Logo en version claire (le fond n'est plus blanc). */
export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-luxury-gold/20 bg-luxury-night/95 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <button onClick={() => navigate("/overview")} className="flex items-center gap-3">
          <img src="/logo-dark-bg.svg" alt="SubServer" className="h-8 w-auto" />
          <span className="text-sm font-bold tracking-tight text-slate-50 hidden sm:inline">SubServer</span>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `border-b-2 pb-1 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "border-luxury-gold font-semibold text-luxury-gold"
                    : "border-transparent text-slate-300 hover:text-slate-50"
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-luxury-gold/15 text-xs font-bold text-luxury-gold transition-colors duration-200 hover:bg-luxury-gold/25"
          >
            {user?.first_name?.charAt(0).toUpperCase() ?? "?"}
          </button>
          <button
            onClick={logout}
            className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300 transition-colors duration-200 hover:bg-white/10 hover:text-slate-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
