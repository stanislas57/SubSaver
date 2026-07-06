import { useEffect, useRef } from "react";
import gsap from "gsap";
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
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const items = navRef.current?.children;
    if (!items || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      items,
      { opacity: 0, x: -16 },
      { opacity: 1, x: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, delay: 0.1 }
    );
  }, []);

  return (
    <aside className="relative flex h-[calc(100vh-1.5rem)] w-72 shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-bg-sidebar/80 px-4 py-6 shadow-2xl backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(600px circle at 0% 0%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(500px circle at 100% 100%, rgba(16,185,129,0.12), transparent 60%)",
        }}
      />
      <div className="relative mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-[0_0_24px_-4px_rgba(59,130,246,0.7)]">
          <Wallet className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold text-white">SubServer</span>
      </div>

      <nav ref={navRef} className="relative flex-1 space-y-1.5">
        <NavLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Tableau de bord" />
        <NavLink to="/subscriptions" icon={<ListChecks className="h-4 w-4" />} label="Abonnements" />
        <NavLink to="/analytics" icon={<BarChart3 className="h-4 w-4" />} label="Analytique" />
        <NavLink to="/calendar" icon={<CalendarDays className="h-4 w-4" />} label="Calendrier" />
        <NavLink to="/premium" icon={<Sparkles className="h-4 w-4" />} label="Premium" />
      </nav>

      <div className="relative space-y-1.5 border-t border-white/10 pt-4">
        <NavLink to="/profile" icon={<User className="h-4 w-4" />} label={user?.first_name ?? "Profil"} />
        <button
          onClick={logout}
          className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium text-text-sidebar transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
