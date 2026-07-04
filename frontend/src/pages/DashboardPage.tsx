import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ListChecks, AlertTriangle, Crown, Landmark } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, daysUntil } from "@/lib/format";
import { getErrorMessage } from "@/api/axiosClient";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const subscriptionsQuery = useSubscriptions();
  const currency = user?.currency ?? "EUR";

  const stats = useMemo(() => {
    const subs = subscriptionsQuery.data ?? [];
    const monthlyTotal = subs.reduce((sum, s) => sum + s.price, 0);
    const trialsEndingSoon = subs.filter((s) => s.trial_end_date && daysUntil(s.trial_end_date) >= 0 && daysUntil(s.trial_end_date) <= 14).length;
    return { monthlyTotal, count: subs.length, trialsEndingSoon };
  }, [subscriptionsQuery.data]);

  const recent = (subscriptionsQuery.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      {!user?.bank_connected && (
        <Card className="border-primary/30 bg-primary-light">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <Landmark className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-text-main">
                Connecte ta banque pour détecter tes abonnements automatiquement.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate("/subscriptions")}>
              Connecter ma banque
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Dépense mensuelle"
          value={formatPrice(stats.monthlyTotal, currency)}
          icon={<Wallet className="h-5 w-5" />}
          loading={subscriptionsQuery.isPending}
        />
        <StatCard
          label="Abonnements actifs"
          value={String(stats.count)}
          icon={<ListChecks className="h-5 w-5" />}
          tone="accent"
          loading={subscriptionsQuery.isPending}
        />
        <StatCard
          label="Essais qui se terminent"
          value={String(stats.trialsEndingSoon)}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="danger"
          loading={subscriptionsQuery.isPending}
        />
        <StatCard
          label="Statut"
          value={user?.is_premium ? "Premium" : "Gratuit"}
          icon={<Crown className="h-5 w-5" />}
          tone={user?.is_premium ? "accent" : "neutral"}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Derniers abonnements</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/subscriptions")}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <SubscriptionList
            subscriptions={recent}
            isLoading={subscriptionsQuery.isPending}
            isError={subscriptionsQuery.isError}
            errorMessage={subscriptionsQuery.error ? getErrorMessage(subscriptionsQuery.error) : undefined}
            onRetry={() => subscriptionsQuery.refetch()}
            currency={currency}
            onAdd={() => navigate("/subscriptions/add")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
