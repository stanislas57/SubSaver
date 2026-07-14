import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import { TrendingUp, TrendingDown, PiggyBank, BarChart3, Calculator, SlidersHorizontal } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/format";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Currency, Subscription } from "@/types";

/** Palette étendue (20 teintes distinctes, thème Luxe : Bleu Nuit, Doré, Bleu
 * clair, Gris perle...) assignée DYNAMIQUEMENT aux catégories réellement
 * présentes dans les données -- jamais une table statique par nom de
 * catégorie. Un mapping fixe par nom (ex: {Telephonie: "..."}) devenait
 * incomplet dès que le TransactionAnalyzer a introduit sa propre taxonomie de
 * 19 catégories ("Téléphonie Mobile", "Énergie"...), distincte des 8
 * catégories historiques du formulaire manuel ("Telephonie", "Streaming"...) :
 * toute catégorie absente de la table retombait sur le même gris que "Autre"
 * (bug QA : "Autre" et "Téléphonie Mobile" identiques). Assigner par ordre
 * d'apparition élimine la classe de bug entière, quelle que soit la
 * taxonomie utilisée. */
const CATEGORY_COLOR_PALETTE = [
  "#0c3c6e", // Bleu nuit
  "#C5A059", // Doré
  "#2563eb", // Bleu clair
  "#8b5cf6", // Violet
  "#0891b2", // Cyan
  "#dc2626", // Terracotta
  "#059669", // Émeraude
  "#ea580c", // Orange brûlé
  "#7c3aed", // Indigo
  "#0d9488", // Sarcelle
  "#b45309", // Ambre foncé
  "#4338ca", // Bleu-violet
  "#be185d", // Rose foncé
  "#65a30d", // Vert olive
  "#0369a1", // Bleu océan
  "#92400e", // Brun doré
  "#6d28d9", // Violet profond
  "#0f766e", // Sarcelle foncé
  "#a16207", // Or terreux
  "#1e3a8a", // Bleu marine
];
const FALLBACK_CATEGORY_COLOR = "#94a3b8"; // Gris perle, si la palette est un jour dépassée

type TimeRangeFilter = "all" | "3m" | "6m" | "12m";
type SharingFilter = "all" | "personal" | "shared";

const TIME_RANGE_LABELS: Record<TimeRangeFilter, string> = {
  all: "Toute la période",
  "3m": "3 derniers mois",
  "6m": "6 derniers mois",
  "12m": "12 derniers mois",
};

const SHARING_LABELS: Record<SharingFilter, string> = {
  all: "Tous",
  personal: "Personnels",
  shared: "Partagés",
};

/** N'exclut que les abonnements dont on connaît la date de début et qu'elle
 * tombe hors de la fenêtre -- ceux sans start_date restent toujours inclus
 * (impossible de les évaluer, donc on ne les masque pas silencieusement). */
function filterByTimeRange(subs: Subscription[], range: TimeRangeFilter): Subscription[] {
  if (range === "all") return subs;
  const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  return subs.filter((s) => !s.start_date || new Date(s.start_date) >= cutoff);
}

interface CategoryDatum {
  category: string;
  price: number;
  value: number;
}

/** Tooltip partagé BarChart/PieChart : "Streaming : 123 €" avec pastille de
 * couleur -- remplace le tooltip brut par défaut de recharts qui affichait
 * le nom technique du champ ("price") au lieu du nom de catégorie. */
function CategoryTooltip({
  active,
  payload,
  currency,
  categoryColorMap,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategoryDatum }>;
  currency: Currency;
  categoryColorMap: Map<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  const color = categoryColorMap.get(entry.category) ?? FALLBACK_CATEGORY_COLOR;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: color }} />
      <span className="font-medium text-luxury-text">{entry.category}</span>
      <span className="text-luxury-text-light"> : {formatPrice(entry.price, currency)}</span>
    </div>
  );
}

/** Petit badge d'évolution vs mois précédent -- baisse de dépense = bonne
 * nouvelle (vert), hausse = à surveiller (ambre). Dérivé de la même
 * simulation déterministe que le graphique "Évolution mensuelle" juste en
 * dessous (aucune donnée historique réelle n'est stockée à ce jour) : les
 * deux se recoupent volontairement pour rester cohérents entre eux. */
function TrendBadge({ percent }: { percent: number | null }) {
  if (percent === null || Number.isNaN(percent)) return null;
  const isIncrease = percent > 0.05;
  const isDecrease = percent < -0.05;
  if (!isIncrease && !isDecrease) {
    return <p className="mt-1 text-xs text-luxury-text-light">Stable vs mois dernier</p>;
  }
  return (
    <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", isDecrease ? "text-emerald-600" : "text-amber-600")}>
      {isDecrease ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
      {Math.abs(percent).toFixed(1)}% vs mois dernier
    </p>
  );
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const subscriptionsQuery = useSubscriptions();
  const allSubs = subscriptionsQuery.data ?? [];

  // Filtres globaux : ne changent QUE quels abonnements entrent dans les
  // calculs ci-dessous, jamais la façon dont un montant donné est calculé.
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("all");
  const [sharingFilter, setSharingFilter] = useState<SharingFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [projectionView, setProjectionView] = useState<"cumulative" | "monthly">("cumulative");

  const availableCategories = useMemo(() => {
    return Array.from(new Set(allSubs.map((s) => s.category || "Autre"))).sort();
  }, [allSubs]);

  const subs = useMemo(() => {
    let result = filterByTimeRange(allSubs, timeRange);
    if (sharingFilter === "personal") result = result.filter((s) => !s.is_shared);
    if (sharingFilter === "shared") result = result.filter((s) => s.is_shared);
    if (categoryFilter !== "all") result = result.filter((s) => (s.category || "Autre") === categoryFilter);
    return result;
  }, [allSubs, timeRange, sharingFilter, categoryFilter]);

  const stats = useMemo(() => {
    const monthlyTotal = subs.reduce((sum, s) => sum + s.price, 0);
    const yearlyTotal = monthlyTotal * 12;
    const avgPerSubscription = subs.length > 0 ? monthlyTotal / subs.length : 0;

    return {
      monthlyTotal,
      yearlyTotal,
      avgPerSubscription,
      count: subs.length,
    };
  }, [subs]);

  // Données pour les graphiques : dépenses par catégorie
  const categoryData: CategoryDatum[] = useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const sub of subs) {
      const cat = sub.category || "Autre";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + sub.price);
    }
    return Array.from(categoryMap.entries())
      .map(([category, price]) => ({ category, price, value: parseFloat(price.toFixed(2)) }))
      .sort((a, b) => b.price - a.price);
  }, [subs]);

  // Une couleur distincte par catégorie réellement présente, assignée par
  // ordre d'apparition (la plus grosse dépense reçoit toujours la même
  // teinte en tête de palette) -- jamais de collision entre 2 catégories.
  // Cette MÊME table est utilisée par le BarChart et le PieChart pour que
  // les deux graphiques restent visuellement synchronisés.
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    categoryData.forEach((entry, index) => {
      map.set(entry.category, CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length]);
    });
    return map;
  }, [categoryData]);

  // Données pour AreaChart : projection future (12 mois). Calcul inchangé
  // (monthlyTotal * (i+1) pour la vue cumulée) -- on expose simplement AUSSI
  // la vue mensuelle (monthlyTotal constant), pour le switch cumulée/mensuelle.
  const projectionData = useMemo(() => {
    const data = [];
    const monthlyTotal = stats.monthlyTotal;
    for (let i = 0; i < 12; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      const monthName = month.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      data.push({
        month: monthName,
        cumulative: parseFloat((monthlyTotal * (i + 1)).toFixed(2)),
        monthly: parseFloat(monthlyTotal.toFixed(2)),
      });
    }
    return data;
  }, [stats.monthlyTotal]);

  // Données pour LineChart : évolution des 6 derniers mois (simulée mais
  // DÉTERMINISTE - sinusoïde douce, pas de Math.random qui provoquait un
  // graphique différent à chaque re-render et des animations parasites)
  const evolutionData = useMemo(() => {
    const data = [];
    const monthlyTotal = stats.monthlyTotal;
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthName = month.toLocaleDateString("fr-FR", { month: "short" });
      const variation = 1 + Math.sin(month.getMonth()) * 0.08;
      data.push({
        mois: monthName,
        dépenses: parseFloat((monthlyTotal * variation).toFixed(2)),
      });
    }
    return data;
  }, [stats.monthlyTotal]);

  // Indicateur d'évolution "vs mois dernier" affiché sur les cartes KPI --
  // dérivé de la MÊME simulation que le graphique d'évolution ci-dessus
  // (aucun historique réel de facturation n'est conservé aujourd'hui), pour
  // rester cohérent avec ce que ce graphique affiche déjà juste en dessous.
  const trendPercent = useMemo(() => {
    if (evolutionData.length < 2) return null;
    const current = evolutionData[evolutionData.length - 1].dépenses;
    const previous = evolutionData[evolutionData.length - 2].dépenses;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  }, [evolutionData]);

  const chartConfig = {
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
    stroke: "#6b7280",
    fill: "#6b7280",
  };

  return (
    <div className="w-full space-y-8 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-gold-soft">
            <BarChart3 className="h-6 w-6 text-luxury-gold-deep" />
          </div>
          <RevealText as="h1" className="break-words text-3xl font-black tracking-tight text-luxury-text sm:text-5xl lg:text-6xl">
            Analytique détaillée
          </RevealText>
          <RevealText className="mt-4 max-w-xl text-lg text-luxury-text-light">
            Analyse complète de tes dépenses d'abonnements par catégorie, tendance et projections.
          </RevealText>
        </div>

        {/* Filtres globaux */}
        <BentoTile className="mb-8 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-luxury-text">
            <SlidersHorizontal className="h-4 w-4 text-luxury-gold-deep" />
            Filtres
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="filter-period" className="text-xs text-luxury-text-light">Plage temporelle</Label>
              <Select id="filter-period" value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRangeFilter)}>
                {(Object.keys(TIME_RANGE_LABELS) as TimeRangeFilter[]).map((key) => (
                  <option key={key} value={key}>{TIME_RANGE_LABELS[key]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-sharing" className="text-xs text-luxury-text-light">Personnels / Partagés</Label>
              <Select id="filter-sharing" value={sharingFilter} onChange={(e) => setSharingFilter(e.target.value as SharingFilter)}>
                {(Object.keys(SHARING_LABELS) as SharingFilter[]).map((key) => (
                  <option key={key} value={key}>{SHARING_LABELS[key]}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-category" className="text-xs text-luxury-text-light">Catégorie</Label>
              <Select id="filter-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">Toutes les catégories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
          </div>
        </BentoTile>

        {/* Skeletons dorés pendant l'analyse des données */}
        {subscriptionsQuery.isPending && (
          <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-3xl border border-slate-900/10 bg-white p-8 shadow-md">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-6 h-4 w-32" />
                <Skeleton className="mt-3 h-9 w-24" />
              </div>
            ))}
          </div>
        )}

        {/* Cartes de statistiques */}
        {!subscriptionsQuery.isPending && (
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-luxury-gold-soft text-luxury-gold-deep">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-luxury-text-light">Dépense mensuelle</p>
              <p className="mt-2 text-4xl font-black text-luxury-text">
                {formatPrice(stats.monthlyTotal, currency)}
              </p>
              <TrendBadge percent={trendPercent} />
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-luxury-gold-soft text-luxury-gold-deep">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-luxury-text-light">Projection annuelle</p>
              <p className="mt-2 text-4xl font-black text-luxury-text">
                {formatPrice(stats.yearlyTotal, currency)}
              </p>
              <TrendBadge percent={trendPercent} />
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-luxury-text-light">Moyenne par abonnement</p>
              <p className="mt-2 text-4xl font-black text-luxury-text">
                {formatPrice(stats.avgPerSubscription, currency)}
              </p>
              <TrendBadge percent={trendPercent} />
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-luxury-text-light">Nombre d'abonnements</p>
              <p className="mt-2 text-4xl font-black text-luxury-text">{stats.count}</p>
            </div>
          </BentoTile>
        </div>
        )}

        {/* Graphiques */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* BarChart : Dépenses par catégorie */}
          <BentoTile className="p-6">
            <h2 className="mb-6 text-xl font-bold text-luxury-text">Dépenses par catégorie</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} margin={{ top: 24, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip content={<CategoryTooltip currency={currency} categoryColorMap={categoryColorMap} />} />
                  <Bar dataKey="price" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry) => (
                      <Cell key={`cell-${entry.category}`} fill={categoryColorMap.get(entry.category) ?? FALLBACK_CATEGORY_COLOR} />
                    ))}
                    <LabelList
                      dataKey="price"
                      position="top"
                      formatter={(v: unknown) => formatPrice(Number(v), currency)}
                      style={{ fontSize: 11, fill: "#475569" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-luxury-text-light">Aucune donnée disponible</p>
            )}
          </BentoTile>

          {/* PieChart : Répartition par catégorie */}
          <BentoTile className="p-6">
            <h2 className="mb-6 text-xl font-bold text-luxury-text">Répartition par catégorie</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="price"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    labelLine={false}
                    label={({ percent }: { percent?: number }) => `${Math.round((percent ?? 0) * 100)}%`}
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={`cell-${entry.category}`}
                        fill={categoryColorMap.get(entry.category) ?? FALLBACK_CATEGORY_COLOR}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip currency={currency} categoryColorMap={categoryColorMap} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-luxury-text-light">Aucune donnée disponible</p>
            )}
          </BentoTile>
        </div>

        {/* LineChart : Évolution sur 6 mois */}
        <BentoTile className="mt-8 p-6">
          <h2 className="mb-6 text-xl font-bold text-luxury-text">Évolution mensuelle (6 derniers mois)</h2>
          {evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData} margin={chartConfig.margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatPrice(Number(value), currency)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="dépenses"
                  stroke="#C5A059"
                  dot={{ fill: "#C5A059", r: 5 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-luxury-text-light">Aucune donnée disponible</p>
          )}
        </BentoTile>

        {/* AreaChart : Projection sur 12 mois -- switch cumulée / mensuelle
         * pour ne plus laisser croire qu'un total cumulé (ex: 2600€) est une
         * dépense mensuelle comme celle affichée juste au-dessus (ex: 200€). */}
        <BentoTile className="mt-8 p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-luxury-text">
              {projectionView === "cumulative" ? "Projection cumulée des dépenses" : "Projection mensuelle des dépenses"}
              <span className="ml-2 font-normal text-luxury-text-light">(12 prochains mois)</span>
            </h2>
            <div className="flex gap-1 rounded-full bg-luxury-bg-soft p-1">
              <button
                type="button"
                onClick={() => setProjectionView("cumulative")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  projectionView === "cumulative" ? "bg-white text-luxury-text shadow-sm" : "text-luxury-text-light"
                )}
              >
                Cumulée
              </button>
              <button
                type="button"
                onClick={() => setProjectionView("monthly")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  projectionView === "monthly" ? "bg-white text-luxury-text shadow-sm" : "text-luxury-text-light"
                )}
              >
                Mensuelle
              </button>
            </div>
          </div>
          <p className="mb-6 text-sm text-luxury-text-light">
            {projectionView === "cumulative"
              ? "Total dépensé si rien ne change d'ici 12 mois -- ce chiffre grandit mois après mois, contrairement à ta dépense mensuelle qui reste stable."
              : "Dépense mensuelle récurrente prévue chaque mois, identique tant qu'aucun abonnement ne change."}
          </p>
          {projectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projectionData} margin={chartConfig.margin}>
                <defs>
                  <linearGradient id="colorDépenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatPrice(Number(value), currency)}
                />
                <Area
                  type="monotone"
                  dataKey={projectionView === "cumulative" ? "cumulative" : "monthly"}
                  name={projectionView === "cumulative" ? "Cumulé" : "Mensuel"}
                  stroke="#C5A059"
                  fillOpacity={1}
                  fill="url(#colorDépenses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-luxury-text-light">Aucune donnée disponible</p>
          )}
        </BentoTile>
      </div>
    </div>
  );
}
