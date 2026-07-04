import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "primary" | "accent" | "danger" | "neutral";
  loading?: boolean;
}

const TONE_BG: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary-light text-primary",
  accent: "bg-emerald-50 text-accent",
  danger: "bg-red-50 text-red-600",
  neutral: "bg-surface-hover text-text-muted",
};

export function StatCard({ label, value, icon, tone = "primary", loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md", TONE_BG[tone])}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-6 w-20" />
          ) : (
            <p className="truncate font-display text-xl font-bold text-text-main">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
