import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import type { Subscription } from "@/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];

export interface ChartCardProps {
  title: string;
  variant: "bar-by-category" | "doughnut-by-category";
  subscriptions: Subscription[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
}

export function ChartCard({ title, variant, subscriptions, isLoading, isError, errorMessage, onRetry }: ChartCardProps) {
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const sub of subscriptions ?? []) {
      map.set(sub.category, (map.get(sub.category) ?? 0) + sub.price);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [subscriptions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-64 w-full" />}
        {isError && <ErrorAlert message={errorMessage ?? "Impossible de charger les données."} onRetry={onRetry} />}
        {!isLoading && !isError && byCategory.length === 0 && (
          <p className="py-10 text-center text-sm text-text-muted">Pas encore assez de données à afficher.</p>
        )}
        {!isLoading && !isError && byCategory.length > 0 && (
          <div className="h-64">
            {variant === "bar-by-category" ? (
              <Bar
                data={{
                  labels: byCategory.map(([cat]) => cat),
                  datasets: [{ label: "€ / mois", data: byCategory.map(([, v]) => v), backgroundColor: "#3b82f6", borderRadius: 6 }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
              />
            ) : (
              <Doughnut
                data={{
                  labels: byCategory.map(([cat]) => cat),
                  datasets: [{ data: byCategory.map(([, v]) => v), backgroundColor: COLORS }],
                }}
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" } } }}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
