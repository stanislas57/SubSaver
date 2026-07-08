import * as React from "react";
import { LineChart, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { RevealText } from "@/components/shared/RevealText";
import { ComparatorOfferCard } from "@/components/lab/ComparatorOfferCard";
import { useMarketOffers } from "@/hooks/useMarket";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES } from "@/types";
import { getErrorMessage } from "@/api/axiosClient";
import { cn } from "@/lib/utils";

const COMING_SOON_CATEGORIES = new Set(["Logement", "Sport", "Banque & Invest", "Transport"]);

/** Espace Particulier Premium : compare l'abonnement en cours (si détecté
 * pour la catégorie choisie) aux meilleures offres du marché, avec économie
 * estimée mise en avant sur chaque carte. Accès garanti Premium (le
 * PremiumOnlyRoute parent redirige déjà vers Stripe sinon). */
export function LabComparatorPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const [category, setCategory] = React.useState<string>(CATEGORIES[0]);

  const offersQuery = useMarketOffers(category);
  const subscriptionsQuery = useSubscriptions();

  const currentPrice = (subscriptionsQuery.data ?? []).find((s) => s.category === category)?.price;
  const bestOfferId = offersQuery.data && offersQuery.data.length > 0
    ? [...offersQuery.data].sort((a, b) => b.score - a.score)[0].id
    : null;

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
            <LineChart className="h-6 w-6" />
          </div>
          <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Comparateur d'offres
          </RevealText>
          <RevealText className="mt-3 max-w-xl text-lg text-luxury-text-light">
            Compare ton abonnement actuel aux meilleures alternatives du marché, catégorie par catégorie.
          </RevealText>
        </div>

        <div className="max-w-2xl">
          <label className="mb-2 block text-sm font-medium text-luxury-text">Catégorie</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const isComingSoon = COMING_SOON_CATEGORIES.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => !isComingSoon && setCategory(cat)}
                  disabled={isComingSoon}
                  className={cn(
                    "relative rounded-lg border-2 p-3 text-center text-sm font-medium transition-all",
                    category === cat && !isComingSoon
                      ? "border-luxury-gold bg-luxury-gold-soft text-luxury-gold-deep"
                      : "border-slate-900/10 bg-white text-luxury-text hover:border-slate-900/20",
                    isComingSoon && "pointer-events-none cursor-not-allowed opacity-50"
                  )}
                  aria-label={`Catégorie ${cat}`}
                >
                  {cat}
                  {isComingSoon && (
                    <span className="absolute right-1 top-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                      Bientôt
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
    </div>
  );
}
