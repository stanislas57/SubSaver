import * as React from "react";
import { LineChart, SlidersHorizontal, LayoutGrid, Rows3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { RevealText } from "@/components/shared/RevealText";
import { ComparatorOfferCard } from "@/components/lab/ComparatorOfferCard";
import { ComparatorOfferTable } from "@/components/lab/ComparatorOfferTable";
import { useMarketOffers } from "@/hooks/useMarket";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, CATEGORY_DISPLAY_LABELS, SPORT_ATTRIBUTE_KEYS, TRANSPORT_ATTRIBUTE_KEYS, BANKING_ATTRIBUTE_KEYS, FRENCH_REGIONS } from "@/types";
import { getErrorMessage } from "@/api/axiosClient";
import { cn } from "@/lib/utils";
import { computeOfferBadges } from "@/lib/marketBadges";
import { MARKET_OFFERS_FALLBACK } from "@/data/marketOffersFallback";
import { matchesUserLocation, withEmployerReimbursement, isFreeTransportCity } from "@/lib/transportGeo";

const COMING_SOON_CATEGORIES = new Set<string>();

type SortMode = "relevance" | "price";
type ViewMode = "cards" | "table";
type EngagementFilter = "all" | "sans" | "avec";

/** Espace Particulier Premium : compare l'abonnement en cours (si détecté
 * pour la catégorie choisie) aux meilleures offres du marché, avec économie
 * estimée mise en avant sur chaque carte. Accès garanti Premium (le
 * PremiumOnlyRoute parent redirige déjà vers Stripe sinon). */
export function LabComparatorPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const [category, setCategory] = React.useState<string>(CATEGORIES[0]);
  const [sortMode, setSortMode] = React.useState<SortMode>("relevance");
  const [viewMode, setViewMode] = React.useState<ViewMode>("cards");
  const [budgetMax, setBudgetMax] = React.useState("");
  const [engagementFilter, setEngagementFilter] = React.useState<EngagementFilter>("all");
  const [activityType, setActivityType] = React.useState("all");
  const [bankType, setBankType] = React.useState("all");
  const [geoRegion, setGeoRegion] = React.useState("");
  const [geoCity, setGeoCity] = React.useState("");
  const [employerReimbursement, setEmployerReimbursement] = React.useState(false);

  const offersQuery = useMarketOffers(category);
  const subscriptionsQuery = useSubscriptions();

  const currentPrice = (subscriptionsQuery.data ?? []).find((s) => s.category === category)?.price;

  // Filet de sécurité : si l'API renvoie 0 offre pour une catégorie que le
  // produit considère pourtant active (ex: DB pas encore migrée/seedée sur cet
  // environnement), on retombe sur le catalogue de repli plutôt que d'afficher
  // une page blanche -- une catégorie activée doit toujours lister ses offres.
  const usingFallback = offersQuery.isSuccess && offersQuery.data.length === 0 && (MARKET_OFFERS_FALLBACK[category]?.length ?? 0) > 0;
  const baseOffers = usingFallback ? MARKET_OFFERS_FALLBACK[category]! : (offersQuery.data ?? []);

  // Types d'activité disponibles pour la catégorie affichée, dérivés de
  // l'attribute optionnel `subcategory` (renseigné pour Sport, cf. migration
  // sport_attrs) -- générique : n'importe quelle catégorie qui pose cet
  // attribute voit son propre filtre "Type d'activité" apparaître.
  const activityTypes = React.useMemo(() => {
    const values = baseOffers
      .map((offer) => offer.attributes?.find((attr) => attr.key === SPORT_ATTRIBUTE_KEYS.subcategory)?.value)
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values));
  }, [baseOffers]);

  // Types d'établissement disponibles pour la catégorie affichée, dérivés de
  // l'attribute optionnel `bank_type` (renseigné pour Banque, cf. migration
  // banking_attrs) -- même logique générique qu'activityTypes ci-dessus.
  const bankTypes = React.useMemo(() => {
    const values = baseOffers
      .map((offer) => offer.attributes?.find((attr) => attr.key === BANKING_ATTRIBUTE_KEYS.bankType)?.value)
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(values));
  }, [baseOffers]);

  // Le sélecteur géo (région/ville) et le toggle remboursement employeur ne
  // s'affichent que pour les catégories qui posent ces attributes (Transport
  // aujourd'hui) -- générique, comme activityTypes pour Sport plus haut.
  const hasGeoScope = baseOffers.some((offer) => offer.attributes?.some((attr) => attr.key === TRANSPORT_ATTRIBUTE_KEYS.scope));
  const hasEmployerReimbursement = baseOffers.some((offer) =>
    offer.attributes?.some((attr) => attr.key === TRANSPORT_ATTRIBUTE_KEYS.employerReimbursement)
  );
  const freeTransportAlert = hasGeoScope && geoCity.trim() !== "" && isFreeTransportCity(geoCity);

  // Filtres appliqués avant tri : budget max, engagement, type d'activité,
  // localisation (région/ville -- offres "Urbain local"/"Régional (TER)" hors
  // de la zone de l'utilisateur exclues, "National" toujours pertinentes).
  const filteredOffers = React.useMemo(() => {
    const offers = baseOffers;
    const maxPrice = budgetMax === "" ? null : Number(budgetMax);
    return offers.filter((offer) => {
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

  // Réduction légale de 50% employeur (Code du travail Art. L3261-2) sur les
  // abonnements domicile-travail éligibles -- appliquée après le filtrage,
  // avant tri/badges/classement pour que tout reste cohérent avec le prix net.
  const displayOffers = React.useMemo(() => {
    return employerReimbursement ? filteredOffers.map(withEmployerReimbursement) : filteredOffers;
  }, [filteredOffers, employerReimbursement]);

  // Calculés sur la liste filtrée mais pas triée : "le moins cher" et
  // "meilleur compromis" doivent rester stables quel que soit le tri actif à
  // l'écran, mais scopés aux offres réellement visibles après filtrage.
  const cheapestId = displayOffers.length > 0
    ? [...displayOffers].sort((a, b) => a.price - b.price)[0].id
    : null;
  const bestMatchId = displayOffers.length > 0
    ? [...displayOffers].sort((a, b) => b.score - a.score)[0].id
    : null;

  const sortedOffers = React.useMemo(() => {
    return [...displayOffers].sort((a, b) => (sortMode === "price" ? a.price - b.price : b.score - a.score));
  }, [displayOffers, sortMode]);

  const badgesByOfferId = React.useMemo(
    () => computeOfferBadges(displayOffers, currentPrice ?? null),
    [displayOffers, currentPrice]
  );

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
                  {CATEGORY_DISPLAY_LABELS[cat] ?? cat}
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
                  <Input
                    type="text"
                    placeholder="ex: Toulouse"
                    value={geoCity}
                    onChange={(e) => setGeoCity(e.target.value)}
                  />
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

        {offersQuery.data && baseOffers.length === 0 && (
          <EmptyState
            icon={<SlidersHorizontal className="h-6 w-6" />}
            title="Aucune offre pour cette catégorie"
            description="Essaie une autre catégorie."
          />
        )}

        {baseOffers.length > 0 && !currentPrice && (
          <p className="rounded-lg border border-luxury-gold/30 bg-luxury-gold-soft/40 px-4 py-3 text-sm text-luxury-text">
            Aucun abonnement {(CATEGORY_DISPLAY_LABELS as Record<string, string>)[category] ?? category} détecté sur ton compte -
            voici les meilleures offres du marché pour te lancer ou optimiser ton budget.
          </p>
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
      </div>
    </div>
  );
}
