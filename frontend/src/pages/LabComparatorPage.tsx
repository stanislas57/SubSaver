import * as React from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, SlidersHorizontal, LayoutGrid, Rows3, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ErrorAlert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { RevealText } from "@/components/shared/RevealText";
import { ComparatorOfferCard } from "@/components/lab/ComparatorOfferCard";
import { ComparatorOfferTable } from "@/components/lab/ComparatorOfferTable";
import { useMarketOffers } from "@/hooks/useMarket";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORY_DISPLAY_LABELS, SPORT_ATTRIBUTE_KEYS, TRANSPORT_ATTRIBUTE_KEYS, BANKING_ATTRIBUTE_KEYS, FRENCH_REGIONS } from "@/types";
import type { Currency, Subscription } from "@/types";
import { getErrorMessage } from "@/api/axiosClient";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { computeOfferBadges } from "@/lib/marketBadges";
import { MARKET_OFFERS_FALLBACK } from "@/data/marketOffersFallback";
import { matchesUserLocation, withEmployerReimbursement, isFreeTransportCity } from "@/lib/transportGeo";
import { matchOffers, inferLocation } from "@/lib/comparatorMatch";

type SortMode = "relevance" | "price";
type ViewMode = "cards" | "table";
type EngagementFilter = "all" | "sans" | "avec";
type Step = 1 | 2 | 3;

/** Durée de l'analyse simulée de l'Étape 2 : 3 à 4 secondes, tirée une seule
 * fois par comparaison pour ne pas raccourcir/rallonger le chargement à
 * chaque re-render. */
function randomLoadingDuration(): number {
  return 3000 + Math.random() * 1000;
}

function categoryLabel(category: string): string {
  return (CATEGORY_DISPLAY_LABELS as Record<string, string>)[category] ?? category;
}

/** Espace Particulier Premium : parcours guidé en 3 étapes -- choix d'un
 * abonnement actif, analyse simulée, puis offres concurrentes contextualisées
 * à cet abonnement (correspondance catégorie + portée géographique, cf.
 * lib/comparatorMatch.ts). Accès garanti Premium (le PremiumOnlyRoute parent
 * redirige déjà vers Stripe sinon). */
export function LabComparatorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currency = user?.currency ?? "EUR";

  const [step, setStep] = React.useState<Step>(1);
  const [selectedSub, setSelectedSub] = React.useState<Subscription | null>(null);
  const loadingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sortMode, setSortMode] = React.useState<SortMode>("relevance");
  const [viewMode, setViewMode] = React.useState<ViewMode>("cards");
  const [budgetMax, setBudgetMax] = React.useState("");
  const [engagementFilter, setEngagementFilter] = React.useState<EngagementFilter>("all");
  const [activityType, setActivityType] = React.useState("all");
  const [bankType, setBankType] = React.useState("all");
  const [geoRegion, setGeoRegion] = React.useState("");
  const [geoCity, setGeoCity] = React.useState("");
  const [employerReimbursement, setEmployerReimbursement] = React.useState(false);

  const subscriptionsQuery = useSubscriptions();
  const category = selectedSub?.category;
  const offersQuery = useMarketOffers(category, { enabled: step !== 1 && Boolean(category) });

  React.useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  function resetFilters() {
    setSortMode("relevance");
    setViewMode("cards");
    setBudgetMax("");
    setEngagementFilter("all");
    setActivityType("all");
    setBankType("all");
    setGeoRegion("");
    setGeoCity("");
    setEmployerReimbursement(false);
  }

  function handleSelectSubscription(sub: Subscription) {
    setSelectedSub(sub);
    setStep(2);
    resetFilters();
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    loadingTimeoutRef.current = setTimeout(() => setStep(3), randomLoadingDuration());
  }

  function handleReset() {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    setStep(1);
    setSelectedSub(null);
    resetFilters();
  }

  // Filet de sécurité : si l'API renvoie 0 offre pour une catégorie que le
  // produit considère pourtant active (ex: DB pas encore migrée/seedée sur cet
  // environnement), on retombe sur le catalogue de repli plutôt que d'afficher
  // une page blanche -- une catégorie activée doit toujours lister ses offres.
  const usingFallback =
    Boolean(category) && offersQuery.isSuccess && offersQuery.data.length === 0 && (MARKET_OFFERS_FALLBACK[category!]?.length ?? 0) > 0;
  const categoryOffers = usingFallback ? MARKET_OFFERS_FALLBACK[category!]! : (offersQuery.data ?? []);

  // Étape 3 : filtre grossier catégorie + portée géographique (cf. spec
  // matching), avant application des filtres complémentaires ci-dessous.
  const baseOffers = React.useMemo(
    () => (selectedSub ? matchOffers(selectedSub, categoryOffers) : []),
    [selectedSub, categoryOffers]
  );

  // Localisation déduite du nom de l'abonnement comparé (cf.
  // lib/comparatorMatch.ts) -- affichée pour que l'utilisateur comprenne
  // pourquoi des offres locales apparaissent sans qu'il ait rien renseigné.
  // Non affichée si la localisation était déjà explicite sur l'abonnement.
  const inferredLocation = React.useMemo(() => {
    if (!selectedSub || selectedSub.location) return null;
    return inferLocation(selectedSub, categoryOffers).location;
  }, [selectedSub, categoryOffers]);

  const activityTypes = React.useMemo(() => {
    const values = baseOffers
      .map((offer) => offer.attributes?.find((attr) => attr.key === SPORT_ATTRIBUTE_KEYS.subcategory)?.value)
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values));
  }, [baseOffers]);

  const bankTypes = React.useMemo(() => {
    const values = baseOffers
      .map((offer) => offer.attributes?.find((attr) => attr.key === BANKING_ATTRIBUTE_KEYS.bankType)?.value)
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values));
  }, [baseOffers]);

  const hasGeoScope = baseOffers.some((offer) => offer.attributes?.some((attr) => attr.key === TRANSPORT_ATTRIBUTE_KEYS.scope));
  const hasEmployerReimbursement = baseOffers.some((offer) =>
    offer.attributes?.some((attr) => attr.key === TRANSPORT_ATTRIBUTE_KEYS.employerReimbursement)
  );
  const freeTransportAlert = hasGeoScope && geoCity.trim() !== "" && isFreeTransportCity(geoCity);

  const filteredOffers = React.useMemo(() => {
    const maxPrice = budgetMax === "" ? null : Number(budgetMax);
    return baseOffers.filter((offer) => {
      if (maxPrice !== null && !Number.isNaN(maxPrice) && offer.price > maxPrice) return false;
      const isNoCommitment = offer.engagement.toLowerCase().startsWith("sans engagement");
      if (engagementFilter === "sans" && !isNoCommitment) return false;
      if (engagementFilter === "avec" && isNoCommitment) return false;
      if (activityType !== "all") {
        const offerType = offer.attributes?.find((attr) => attr.key === SPORT_ATTRIBUTE_KEYS.subcategory)?.value;
        if (offerType !== activityType) return false;
      }
      if (bankType !== "all") {
        const offerBankType = offer.attributes?.find((attr) => attr.key === BANKING_ATTRIBUTE_KEYS.bankType)?.value;
        if (offerBankType !== bankType) return false;
      }
      if (!matchesUserLocation(offer, geoRegion, geoCity)) return false;
      return true;
    });
  }, [baseOffers, budgetMax, engagementFilter, activityType, bankType, geoRegion, geoCity]);

  const displayOffers = React.useMemo(() => {
    return employerReimbursement ? filteredOffers.map(withEmployerReimbursement) : filteredOffers;
  }, [filteredOffers, employerReimbursement]);

  const currentPrice = selectedSub?.price;

  const cheapestId = displayOffers.length > 0 ? [...displayOffers].sort((a, b) => a.price - b.price)[0].id : null;
  const bestMatchId = displayOffers.length > 0 ? [...displayOffers].sort((a, b) => b.score - a.score)[0].id : null;

  const sortedOffers = React.useMemo(() => {
    return [...displayOffers].sort((a, b) => (sortMode === "price" ? a.price - b.price : b.score - a.score));
  }, [displayOffers, sortMode]);

  const badgesByOfferId = React.useMemo(() => computeOfferBadges(displayOffers, currentPrice ?? null), [displayOffers, currentPrice]);

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {step === 3 && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-luxury-text-light transition-colors hover:text-luxury-text"
          >
            <ArrowLeft className="h-4 w-4" /> Comparer un autre abonnement
          </button>
        )}

        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
            <LineChart className="h-6 w-6" />
          </div>
          <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Comparateur d'offres
          </RevealText>
          <RevealText className="mt-3 max-w-xl text-lg text-luxury-text-light">
            {step === 1 && "Quel abonnement souhaites-tu comparer aujourd'hui ?"}
            {step === 2 && "Un instant, on passe le marché au crible."}
            {step === 3 && selectedSub && (
              <>
                Meilleures alternatives à <strong className="text-luxury-text">{selectedSub.display_name || selectedSub.name}</strong>, catégorie{" "}
                {categoryLabel(selectedSub.category)}.
              </>
            )}
          </RevealText>
        </div>

        {step === 1 && (
          <SubscriptionPicker
            subscriptionsQuery={subscriptionsQuery}
            currency={currency}
            onSelect={handleSelectSubscription}
            onAddSubscription={() => navigate("/subscriptions")}
          />
        )}

        {step === 2 && selectedSub && <AnalyzingStep subscription={selectedSub} />}

        {step === 3 && selectedSub && (
          <>
            {inferredLocation && (
              <p className="rounded-lg border border-luxury-gold/30 bg-luxury-gold-soft/40 px-4 py-3 text-sm text-luxury-text">
                📍 Localisation déduite de ton abonnement <strong>{selectedSub.display_name || selectedSub.name}</strong> : <strong>{inferredLocation}</strong>.
                Les offres locales de cette ville sont incluses ci-dessous.
              </p>
            )}

            {baseOffers.length > 0 && (
              <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-900/10 bg-white p-4">
                <div className="w-32">
                  <label className="mb-1.5 block text-xs font-medium text-luxury-text-light">Budget max</label>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="€/mois"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <label className="mb-1.5 block text-xs font-medium text-luxury-text-light">Engagement</label>
                  <Select value={engagementFilter} onChange={(e) => setEngagementFilter(e.target.value as EngagementFilter)}>
                    <option value="all">Tous</option>
                    <option value="sans">Sans engagement</option>
                    <option value="avec">Avec engagement</option>
                  </Select>
                </div>
                {activityTypes.length > 1 && (
                  <div className="w-56">
                    <label className="mb-1.5 block text-xs font-medium text-luxury-text-light">Type d'activité</label>
                    <Select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                      <option value="all">Tous</option>
                      {activityTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </div>
                )}
                {bankTypes.length > 1 && (
                  <div className="w-56">
                    <label className="mb-1.5 block text-xs font-medium text-luxury-text-light">Type d'établissement</label>
                    <Select value={bankType} onChange={(e) => setBankType(e.target.value)}>
                      <option value="all">Tous</option>
                      {bankTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </div>
                )}
                {hasGeoScope && (
                  <>
                    <div className="w-52">
                      <label className="mb-1.5 block text-xs font-medium text-luxury-text-light">Ma région</label>
                      <Select value={geoRegion} onChange={(e) => setGeoRegion(e.target.value)}>
                        <option value="">Peu importe</option>
                        {FRENCH_REGIONS.map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="w-48">
                      <label className="mb-1.5 block text-xs font-medium text-luxury-text-light">Ma ville</label>
                      <Input type="text" placeholder="ex: Toulouse" value={geoCity} onChange={(e) => setGeoCity(e.target.value)} />
                    </div>
                  </>
                )}
                {hasEmployerReimbursement && (
                  <label className="flex items-center gap-2 pb-2.5 text-sm text-luxury-text">
                    <input
                      type="checkbox"
                      checked={employerReimbursement}
                      onChange={(e) => setEmployerReimbursement(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Remboursement employeur -50%
                  </label>
                )}
              </div>
            )}

            {freeTransportAlert && (
              <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                🎉 {geoCity} fait partie des villes où les transports en commun sont gratuits pour les résidents.
                Arrête de payer un abonnement si tu y habites déjà !
              </p>
            )}

            {baseOffers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-luxury-text">Trier par</span>
                  <div className="flex overflow-hidden rounded-lg border border-slate-900/10">
                    <button
                      onClick={() => setSortMode("relevance")}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium transition-colors",
                        sortMode === "relevance" ? "bg-luxury-gold-soft text-luxury-gold-deep" : "bg-white text-luxury-text-light hover:text-luxury-text"
                      )}
                    >
                      Pertinence
                    </button>
                    <button
                      onClick={() => setSortMode("price")}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium transition-colors",
                        sortMode === "price" ? "bg-luxury-gold-soft text-luxury-gold-deep" : "bg-white text-luxury-text-light hover:text-luxury-text"
                      )}
                    >
                      Prix croissant
                    </button>
                  </div>
                </div>

                <div className="flex overflow-hidden rounded-lg border border-slate-900/10">
                  <button
                    onClick={() => setViewMode("cards")}
                    aria-label="Vue cartes"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                      viewMode === "cards" ? "bg-luxury-gold-soft text-luxury-gold-deep" : "bg-white text-luxury-text-light hover:text-luxury-text"
                    )}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Cartes
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    aria-label="Vue tableau"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors",
                      viewMode === "table" ? "bg-luxury-gold-soft text-luxury-gold-deep" : "bg-white text-luxury-text-light hover:text-luxury-text"
                    )}
                  >
                    <Rows3 className="h-3.5 w-3.5" /> Tableau
                  </button>
                </div>
              </div>
            )}

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

            {offersQuery.data && categoryOffers.length === 0 && (
              <EmptyState
                icon={<SlidersHorizontal className="h-6 w-6" />}
                title="Aucune offre pour cette catégorie"
                description="Reviens plus tard, notre catalogue est mis à jour régulièrement."
              />
            )}

            {categoryOffers.length > 0 && baseOffers.length === 0 && (
              <EmptyState
                icon={<SlidersHorizontal className="h-6 w-6" />}
                title="Aucune alternative pertinente trouvée"
                description="Aucune offre nationale ou locale à ta localisation n'a été trouvée pour cette catégorie."
              />
            )}

            {baseOffers.length > 0 && displayOffers.length === 0 && (
              <EmptyState
                icon={<SlidersHorizontal className="h-6 w-6" />}
                title="Aucune offre ne correspond à ces filtres"
                description="Essaie d'élargir le budget max, ta zone géographique ou de repasser l'engagement sur 'Tous'."
              />
            )}

            {displayOffers.length > 0 && viewMode === "cards" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedOffers.map((offer) => (
                  <ComparatorOfferCard
                    key={offer.id}
                    offer={offer}
                    currency={currency}
                    isCheapest={offer.id === cheapestId}
                    isBestMatch={offer.id === bestMatchId}
                    currentPrice={currentPrice}
                    badges={badgesByOfferId.get(offer.id)}
                  />
                ))}
              </div>
            )}

            {displayOffers.length > 0 && viewMode === "table" && (
              <ComparatorOfferTable
                offers={sortedOffers}
                currency={currency}
                cheapestId={cheapestId}
                bestMatchId={bestMatchId}
                badgesByOfferId={badgesByOfferId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SubscriptionPicker({
  subscriptionsQuery,
  currency,
  onSelect,
  onAddSubscription,
}: {
  subscriptionsQuery: ReturnType<typeof useSubscriptions>;
  currency: Currency;
  onSelect: (sub: Subscription) => void;
  onAddSubscription: () => void;
}) {
  if (subscriptionsQuery.isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    );
  }

  if (subscriptionsQuery.isError) {
    return <ErrorAlert message={getErrorMessage(subscriptionsQuery.error, "Impossible de charger tes abonnements.")} onRetry={() => subscriptionsQuery.refetch()} />;
  }

  const subscriptions = subscriptionsQuery.data ?? [];

  if (subscriptions.length === 0) {
    return (
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="Aucun abonnement actif"
        description="Ajoute d'abord un abonnement pour pouvoir le comparer aux meilleures offres du marché."
        actionLabel="Ajouter un abonnement"
        onAction={onAddSubscription}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subscriptions.map((sub) => (
        <Card key={sub.id} className="cursor-pointer" onClick={() => onSelect(sub)}>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-luxury-text">{sub.display_name || sub.name}</p>
                <Badge variant="neutral" className="mt-1.5">{categoryLabel(sub.category)}</Badge>
              </div>
              <p className="shrink-0 text-lg font-black text-luxury-text">
                {formatPrice(sub.price, currency)}
                <span className="text-xs font-medium text-luxury-text-light">/mois</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(sub);
              }}
            >
              Comparer sur le marché <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AnalyzingStep({ subscription }: { subscription: Subscription }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-slate-900/10 bg-white px-6 py-24 text-center">
      <Spinner className="h-10 w-10" />
      <div className="space-y-2">
        <p className="text-lg font-bold text-luxury-text">Analyse des offres concurrentielles du marché...</p>
        <p className="text-sm text-luxury-text-light">
          Recherche des meilleures alternatives à {subscription.display_name || subscription.name}
        </p>
      </div>
      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
