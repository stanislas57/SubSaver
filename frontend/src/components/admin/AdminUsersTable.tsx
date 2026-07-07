import { Pencil, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/types";

export interface AdminUsersTableProps {
  users: AdminUser[];
  isLoading?: boolean;
  onEdit: (user: AdminUser) => void;
}

const TH = "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500";
const TD = "px-4 py-3 text-sm text-slate-300";

/** Tableau CRM dense : ID, Email, Date d'inscription, Statut, Nombre
 * d'abonnements détectés, Dernière connexion, action "Éditer". Recherche et
 * pagination gérées par le composant parent (AdminUsersPage). */
export function AdminUsersTable({ users, isLoading, onEdit }: AdminUsersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <table className="w-full border-collapse">
        <thead className="bg-slate-900">
          <tr className="border-b border-slate-800">
            <th className={TH}>ID</th>
            <th className={TH}>Email</th>
            <th className={TH}>Inscription</th>
            <th className={TH}>Statut</th>
            <th className={TH}>Abonnements</th>
            <th className={TH}>Dernière connexion</th>
            <th className={cn(TH, "text-right")}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 bg-slate-950">
          {isLoading &&
            Array.from({ length: 6 }, (_, i) => (
              <tr key={i}>
                <td colSpan={7} className="px-4 py-3">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-800" />
                </td>
              </tr>
            ))}

          {!isLoading && users.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                Aucun utilisateur ne correspond à cette recherche.
              </td>
            </tr>
          )}

          {!isLoading &&
            users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-slate-900">
                <td className={cn(TD, "font-mono text-xs text-slate-500")} title={user.id}>
                  {user.id.slice(0, 8)}…
                </td>
                <td className={TD}>
                  <div className="flex items-center gap-1.5">
                    {user.email}
                    {user.is_admin && <ShieldCheck className="h-3.5 w-3.5 text-amber-500" aria-label="Administrateur" />}
                  </div>
                  <p className="text-xs text-slate-500">{user.first_name}</p>
                </td>
                <td className={TD}>{formatDateTime(user.created_at)}</td>
                <td className={TD}>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                      user.is_premium ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {user.is_premium ? "Premium" : "Standard"}
                  </span>
                </td>
                <td className={TD}>{user.subscriptions_count}</td>
                <td className={TD}>{formatDateTime(user.last_login_at)}</td>
                <td className={cn(TD, "text-right")}>
                  <button
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
                  >
                    <Pencil className="h-3 w-3" /> Éditer
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
