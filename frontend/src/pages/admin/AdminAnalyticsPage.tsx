import { Users, UserPlus, TrendingUp, Activity } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/useAdmin";

function KpiCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-100">
        {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-800" /> : value}
      </p>
    </div>
  );
}

/** Vue "Analytique et Tracking" : KPI de base calculés côté backend (comptes
 * réels), et emplacement prévu pour un futur outil de tracking comportemental
 * tiers (cf. hooks/useAnalyticsTracking.ts). */
export function AdminAnalyticsPage() {
  const analyticsQuery = useAdminAnalytics();
  const data = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Analytique</h1>
        <p className="text-sm text-slate-500">Vue d'ensemble de la croissance et de la conversion Premium.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Inscrits totaux" value={String(data?.total_users ?? 0)} loading={analyticsQuery.isPending} />
        <KpiCard icon={UserPlus} label="Nouveaux aujourd'hui" value={String(data?.new_users_today ?? 0)} loading={analyticsQuery.isPending} />
        <KpiCard icon={TrendingUp} label="Membres Premium" value={String(data?.premium_users ?? 0)} loading={analyticsQuery.isPending} />
        <KpiCard
          icon={Activity}
          label="Taux de conversion Premium"
          value={`${data?.premium_conversion_rate ?? 0}%`}
          loading={analyticsQuery.isPending}
        />
      </div>

      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-sm font-semibold text-slate-200">Tracking comportemental</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Le suivi des clics et du parcours utilisateur (heatmaps, funnels, session replay) n'est pas réimplémenté
          en interne pour des raisons de performance : brancher un outil pro (PostHog, Vercel Analytics, Google
          Analytics) via <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-amber-400">useAnalyticsTracking</code>
          , déjà prêt dans <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-amber-400">src/hooks/useAnalyticsTracking.ts</code>.
        </p>
      </div>
    </div>
  );
}
