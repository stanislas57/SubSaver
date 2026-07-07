import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, LogOut, ArrowLeftCircle, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Utilisateurs", icon: Users, end: false },
  { to: "/admin/analytics", label: "Analytique", icon: BarChart3, end: false },
];

/** Layout du Back-Office : thème utilitaire sombre, dense, technique --
 * volontairement à l'opposé du design "Luxe Lumineux" du site public, pour
 * qu'un admin identifie immédiatement qu'il est dans un outil interne. Sidebar
 * fixe + grille de contenu, pas d'animation GSAP/framer-motion ni de logo
 * marketing. */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full bg-slate-950 font-mono text-slate-200">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-100">Super Admin</p>
            <p className="text-[11px] text-slate-500">SubServer Back-Office</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-amber-500/10 text-amber-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 px-3 py-4">
          <button
            onClick={() => navigate("/overview")}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            <ArrowLeftCircle className="h-4 w-4" />
            Retour au site
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-6">
          <p className="text-xs uppercase tracking-widest text-slate-500">Environnement d'administration</p>
          <p className="text-xs text-slate-500">
            Connecté en tant que <span className="text-slate-300">{user?.email}</span>
          </p>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
