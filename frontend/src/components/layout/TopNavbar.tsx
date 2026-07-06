import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { to: "/subscriptions", label: "Abonnements" },
  { to: "/analytics", label: "Analytique" },
  { to: "/premium", label: "Premium" },
];

/** Navigation unique de l'app : barre fixe en haut, plus de menu latéral.
 * Glassmorphism prononcé (bg-black/40 + backdrop-blur-2xl) pour flotter au-dessus
 * des sections cinématiques du contenu. */
export function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">SubServer</span>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-white"
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white transition-colors duration-200 hover:bg-white/20"
          >
            {user?.first_name?.charAt(0).toUpperCase() ?? "?"}
          </button>
          <button
            onClick={logout}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
