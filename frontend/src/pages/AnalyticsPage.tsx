import { useMemo } from "react";
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
} from "recharts";
import { TrendingUp, PiggyBank, BarChart3, TrendingDown } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/format";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";

const CATEGORY_COLORS = {
  Streaming: "#3b82f6",
  Musique: "#8b5cf6",
  Sport: "#10b981",
  Logement: "#f59e0b",
  Telephonie: "#06b6d4",
  Transport: "#ec4899",
  "Banque & Invest": "#6366f1",
  Autre: "#6b7280",
};

export function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const subscriptionsQuery = useSubscriptions();
  const subs = subscriptionsQuery.data ?? [];

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
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    for (const sub of subs) {
      const cat = sub.category || "Autre";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + sub.price);
    }
    return Array.from(categoryMap.entries())
      .map(([category, price]) => ({ category, price, value: parseFloat(price.toFixed(2)) }))
      .sort((a, b) => b.price - a.price);
  }, [subs]);

  // Données pour AreaChart : projection future (12 mois)
  const projectionData = useMemo(() => {
    const data = [];
    const monthlyTotal = stats.monthlyTotal;
    for (let i = 0; i < 12; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      const monthName = month.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      data.push({
        month: monthName,
        dépenses: parseFloat((monthlyTotal * (i + 1)).toFixed(2)),
      });
    }
    return data;
  }, [stats.monthlyTotal]);

  // Données pour LineChart : évolution des 6 derniers mois (simulée)
  const evolutionData = useMemo(() => {
    const data = [];
    const monthlyTotal = stats.monthlyTotal;
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthName = month.toLocaleDateString("fr-FR", { month: "short" });
      // Variation simulée : ±10%
      const variation = 1 + (Math.random() - 0.5) * 0.2;
      data.push({
        mois: monthName,
        dépenses: parseFloat((monthlyTotal * variation).toFixed(2)),
      });
    }
    return data;
  }, [stats.monthlyTotal]);

  const chartConfig = {
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
    stroke: "#6b7280",
    fill: "#6b7280",
  };

  return (
    <div className="w-full space-y-8 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="mb-12">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-sapphire/10">
            <BarChart3 className="h-6 w-6 text-luxury-sapphire" />
          </div>
          <RevealText as="h1" className="text-5xl font-black tracking-tight text-luxury-text sm:text-6xl">
            Analytique détaillée
          </RevealText>
          <RevealText className="mt-4 max-w-xl text-lg text-luxury-text-light">
            Analyse complète de tes dépenses d'abonnements par catégorie, tendance et projections.
          </RevealText>
        </div>

        {/* Cartes de statistiques */}
        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-luxury-sapphire/10 text-luxury-sapphire">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-luxury-text-light">Dépense mensuelle</p>
              <p className="mt-2 text-4xl font-black text-luxury-text">
                {formatPrice(stats.monthlyTotal, currency)}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-luxury-champagne/20 text-luxury-champagne">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-luxury-text-light">Projection annuelle</p>
              <p className="mt-2 text-4xl font-black text-luxury-text">
                {formatPrice(stats.yearlyTotal, currency)}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-luxury-text-light">Moyenne par abonnement</p>
              <p className="mt-2 text-4xl font-black text-luxury-text">
                {formatPrice(stats.avgPerSubscription, currency)}
              </p>
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

        {/* Graphiques */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* BarChart : Dépenses par catégorie */}
          <BentoTile className="p-6">
            <h2 className="mb-6 text-xl font-bold text-luxury-text">Dépenses par catégorie</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => formatPrice(Number(value), currency)}
                  />
                  <Bar dataKey="price" fill="#0c3c6e" radius={[8, 8, 0, 0]} />
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
                  >
                    {categoryData.map((entry) => (
                      <Cell
                        key={`cell-${entry.category}`}
                        fill={(CATEGORY_COLORS as Record<string, string>)[entry.category] || "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatPrice(Number(value), currency)}
                    labelFormatter={(label) => `${label}`}
                  />
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
                  stroke="#0c3c6e"
                  dot={{ fill: "#0c3c6e", r: 5 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-luxury-text-light">Aucune donnée disponible</p>
          )}
        </BentoTile>

        {/* AreaChart : Projection sur 12 mois */}
        <BentoTile className="mt-8 p-6">
          <h2 className="mb-6 text-xl font-bold text-luxury-text">Projection des dépenses (12 prochains mois)</h2>
          {projectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projectionData} margin={chartConfig.margin}>
                <defs>
                  <linearGradient id="colorDépenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c3c6e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0c3c6e" stopOpacity={0} />
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
                <Area type="monotone" dataKey="dépenses" stroke="#0c3c6e" fillOpacity={1} fill="url(#colorDépenses)" />
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
