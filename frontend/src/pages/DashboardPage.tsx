import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  Wallet,
  ListChecks,
  AlertTriangle,
  Crown,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  Sparkles,
  User,
  LogOut,
  Bell,
  Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatPrice, daysUntil } from "@/lib/format";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/subscriptions", icon: ListChecks, label: "Abonnements" },
  { to: "/analytics", icon: BarChart3, label: "Analytique" },
  { to: "/calendar", icon: CalendarDays, label: "Calendrier" },
  { to: "/premium", icon: Sparkles, label: "Premium" },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const subscriptionsQuery = useSubscriptions();
  const currency = user?.currency ?? "EUR";

  const stats = useMemo(() => {
    const subs = subscriptionsQuery.data ?? [];
    const monthlyTotal = subs.reduce((sum, s) => sum + s.price, 0);
    const trialsEndingSoon = subs.filter(
      (s) => s.trial_end_date && daysUntil(s.trial_end_date) >= 0 && daysUntil(s.trial_end_date) <= 14
    ).length;
    return { monthlyTotal, count: subs.length, trialsEndingSoon };
  }, [subscriptionsQuery.data]);

  const recent = (subscriptionsQuery.data ?? []).slice(0, 5);

  const sidebarRef = useRef<HTMLElement>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = cardsRef.current ? Array.from(cardsRef.current.children) : [];
    const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });

    tl.from(sidebarRef.current, { y: 50, opacity: 0 })
      .from(topbarRef.current, { y: 50, opacity: 0 })
      .from(cards, { y: 50, opacity: 0, stagger: 0.12 });
  }, []);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      <aside
        ref={sidebarRef}
        className="relative z-10 flex w-64 shrink-0 flex-col border-r border-white/10 bg-white/5 px-4 py-6 backdrop-blur-xl"
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">SubServer</span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.to === "/dashboard";
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 pt-4">
          <button
            onClick={() => navigate("/profile")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            <User className="h-4 w-4" />
            {user?.first_name ?? "Profil"}
          </button>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header
          ref={topbarRef}
          className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-8 backdrop-blur-xl"
        >
          <h1 className="text-lg font-semibold tracking-tight">Tableau de bord</h1>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-white">
              <Bell className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-white">
              <Moon className="h-4 w-4" />
            </button>
            <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold">
              {user?.first_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div ref={cardsRef} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Dépense mensuelle"
              value={formatPrice(stats.monthlyTotal, currency)}
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatTile label="Abonnements actifs" value={String(stats.count)} icon={<ListChecks className="h-5 w-5" />} />
            <StatTile
              label="Essais qui se terminent"
              value={String(stats.trialsEndingSoon)}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <StatTile
              label="Statut"
              value={user?.is_premium ? "Premium" : "Gratuit"}
              icon={<Crown className="h-5 w-5" />}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition-colors duration-300 hover:bg-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="text-base font-semibold tracking-tight text-white">Derniers abonnements</h2>
              <button
                onClick={() => navigate("/subscriptions")}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Voir tout
              </button>
            </div>
            <div className="divide-y divide-white/10 px-2 py-2">
              {recent.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-zinc-500">Aucun abonnement pour l'instant.</p>
              )}
              {recent.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-4 rounded-lg px-4 py-3 transition-colors duration-200 hover:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{sub.name}</p>
                      <p className="text-xs text-zinc-500">Le {sub.billing_day} du mois</p>
                    </div>
                  </div>
                  <p className="shrink-0 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-sm font-semibold text-transparent">
                    {formatPrice(sub.price, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-colors duration-300 hover:bg-white/10">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">{icon}</div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-2xl font-bold text-transparent">
        {value}
      </p>
    </div>
  );
}
