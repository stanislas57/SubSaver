import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  CalendarDays,
  Sparkles,
  User,
  LogOut,
  Wallet,
} from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col overflow-hidden bg-bg-sidebar px-3 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 0% 0%, rgba(59,130,246,0.15), transparent 60%), radial-gradient(500px circle at 100% 100%, rgba(16,185,129,0.10), transparent 60%)",
        }}
      />
      <div className="relative mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
          <Wallet className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold text-white">SubServer</span>
      </div>

      <nav className="relative flex-1 space-y-1">
        <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Tableau de bord" />
        <NavLink to="/subscriptions" icon={<ListChecks className="h-4 w-4" />} label="Abonnements" />
        <NavLink to="/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analytique" />
        <NavLink to="/calendar" icon={<CalendarDays className="h-4 w-4" />} label="Calendrier" />
        <NavLink to="/premium" icon={<Sparkles className="h-4 w-4" />} label="Premium" />
      </nav>

      <div className="relative space-y-1 border-t border-border-sidebar pt-3">
        <NavLink to="/profile" icon={<User className="h-4 w-4" />} label={user?.first_name ?? "Profil"} />
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-text-sidebar transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
