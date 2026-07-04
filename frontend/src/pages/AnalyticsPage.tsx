import { ChartCard } from "@/components/analytics/ChartCard";
import { StatCard } from "@/components/shared/StatCard";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/format";
import { getErrorMessage } from "@/api/axiosClient";
import { TrendingUp, PiggyBank } from "lucide-react";

export function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const subscriptionsQuery = useSubscriptions();

  const monthlyTotal = (subscriptionsQuery.data ?? []).reduce((sum, s) => sum + s.price, 0);
  const yearlyTotal = monthlyTotal * 12;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Dépense annuelle projetée"
          value={formatPrice(yearlyTotal, currency)}
          icon={<TrendingUp className="h-5 w-5" />}
          loading={subscriptionsQuery.isPending}
        />
        <StatCard
          label="Dépense mensuelle"
          value={formatPrice(monthlyTotal, currency)}
          icon={<PiggyBank className="h-5 w-5" />}
          tone="accent"
          loading={subscriptionsQuery.isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Dépense mensuelle par catégorie"
          variant="bar-by-category"
          subscriptions={subscriptionsQuery.data}
          isLoading={subscriptionsQuery.isPending}
          isError={subscriptionsQuery.isError}
          errorMessage={subscriptionsQuery.error ? getErrorMessage(subscriptionsQuery.error) : undefined}
          onRetry={() => subscriptionsQuery.refetch()}
        />
        <ChartCard
          title="Répartition par catégorie"
          variant="doughnut-by-category"
          subscriptions={subscriptionsQuery.data}
          isLoading={subscriptionsQuery.isPending}
          isError={subscriptionsQuery.isError}
          errorMessage={subscriptionsQuery.error ? getErrorMessage(subscriptionsQuery.error) : undefined}
          onRetry={() => subscriptionsQuery.refetch()}
        />
      </div>
    </div>
  );
}
