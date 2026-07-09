import * as React from "react";
import { Bell, AlertTriangle, Copy } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "trial" | "duplicate";
  message: string;
}

/** Alertes calculées côté client depuis les abonnements réels déjà chargés (aucune donnée simulée). */
function computeAlerts(subscriptions: ReturnType<typeof useSubscriptions>["data"]): Alert[] {
  if (!subscriptions) return [];
  const alerts: Alert[] = [];

  for (const sub of subscriptions) {
    if (sub.trial_end_date) {
      const days = daysUntil(sub.trial_end_date);
      if (days >= 0 && days <= 7) {
        alerts.push({
          id: `trial-${sub.id}`,
          type: "trial",
          message: `L'essai de ${sub.name} se termine dans ${days} jour${days > 1 ? "s" : ""}`,
        });
      }
    }
  }

  const byDomain = new Map<string, number>();
  for (const sub of subscriptions) {
    if (!sub.domain) continue;
    byDomain.set(sub.domain, (byDomain.get(sub.domain) ?? 0) + 1);
  }
  for (const [domain, count] of byDomain) {
    if (count > 1) {
      alerts.push({ id: `dup-${domain}`, type: "duplicate", message: `${count} abonnements actifs sur ${domain}` });
    }
  }

  return alerts;
}

export interface NotificationCenterProps {
  /** Style du bouton déclencheur -- surchargeable pour s'intégrer sur un
   * fond sombre (ex: TopNavbar) plutôt que sur un fond clair. */
  triggerClassName?: string;
}

export function NotificationCenter({ triggerClassName }: NotificationCenterProps = {}) {
  const { data: subscriptions } = useSubscriptions();
  const [open, setOpen] = React.useState(false);
  const alerts = computeAlerts(subscriptions);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text-main",
          triggerClassName
        )}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {alerts.length > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface p-2 shadow-lg">
            <p className="px-2 py-1.5 text-xs font-semibold text-text-muted">Notifications</p>
            {alerts.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-text-muted">Rien à signaler.</p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-y-auto">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-2 rounded-sm px-2 py-2 text-sm",
                      alert.type === "trial" ? "text-amber-700" : "text-primary"
                    )}
                  >
                    {alert.type === "trial" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <Copy className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    {alert.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
