import { Link } from "react-router-dom";
import { Users, BarChart3, Activity } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/useAdmin";

/** Page d'accueil du Back-Office : résumé rapide + liens vers les deux
 * outils principaux (CRM utilisateurs, analytique). */
export function AdminDashboardPage() {
  const analyticsQuery = useAdminAnalytics();
  const data = analyticsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500">Pilotage interne SubServer -- accès restreint aux administrateurs.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <Activity className="mb-3 h-5 w-5 text-amber-500" />
          <p className="text-xs uppercase tracking-wider text-slate-500">Inscrits totaux</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{data?.total_users ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <Activity className="mb-3 h-5 w-5 text-amber-500" />
          <p className="text-xs uppercase tracking-wider text-slate-500">Conversion Premium</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{data ? `${data.premium_conversion_rate}%` : "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <Activity className="mb-3 h-5 w-5 text-amber-500" />
          <p className="text-xs uppercase tracking-wider text-slate-500">Nouveaux aujourd'hui</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{data?.new_users_today ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/admin/users"
          className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-amber-500/40"
        >
          <Users className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-slate-100">Gestion des utilisateurs</p>
            <p className="text-xs text-slate-500">Rechercher, éditer, corriger les comptes clients.</p>
          </div>
        </Link>
        <Link
          to="/admin/analytics"
          className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-amber-500/40"
        >
          <BarChart3 className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-slate-100">Analytique</p>
            <p className="text-xs text-slate-500">KPI de croissance et de conversion Premium.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
