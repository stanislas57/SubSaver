import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { ComparatorOfferCard } from "@/components/lab/ComparatorOfferCard";
import { PremiumLockModal } from "@/components/shared/PremiumLockModal";
import { useMarketOffers } from "@/hooks/useMarket";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES } from "@/types";
import { getErrorMessage } from "@/api/axiosClient";
import { SlidersHorizontal } from "lucide-react";

export function LabComparatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const [category, setCategory] = React.useState<string>(CATEGORIES[0]);

  const offersQuery = useMarketOffers(category);
  const subscriptionsQuery = useSubscriptions();

  const currentPrice = (subscriptionsQuery.data ?? []).find((s) => s.category === category)?.price;
  const bestOfferId = offersQuery.data && offersQuery.data.length > 0
    ? [...offersQuery.data].sort((a, b) => b.score - a.score)[0].id
    : null;

  if (!user?.is_premium) {
    return <PremiumLockModal open onOpenChange={(open) => !open && navigate("/premium")} feature="Le comparateur d'offres" />;
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Catégorie">
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      {offersQuery.isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      )}

      {offersQuery.isError && (
        <ErrorAlert message={getErrorMessage(offersQuery.error, "Impossible de charger les offres.")} onRetry={() => offersQuery.refetch()} />
      )}

      {offersQuery.data && offersQuery.data.length === 0 && (
        <EmptyState
          icon={<SlidersHorizontal className="h-6 w-6" />}
          title="Aucune offre pour cette catégorie"
          description="Essaie une autre catégorie."
        />
      )}

      {offersQuery.data && offersQuery.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offersQuery.data.map((offer) => (
            <ComparatorOfferCard
              key={offer.id}
              offer={offer}
              currency={currency}
              isBest={offer.id === bestOfferId}
              currentPrice={currentPrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}
