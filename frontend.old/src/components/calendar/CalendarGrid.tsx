import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Subscription, Currency } from "@/types";

export interface CalendarGridProps {
  month: Date;
  subscriptions: Subscription[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  currency: Currency;
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function CalendarGrid({ month, subscriptions, isLoading, isError, errorMessage, onRetry, currency }: CalendarGridProps) {
  const cells = useMemo(() => buildMonthCells(month), [month]);
  const today = new Date();

  const byDay = useMemo(() => {
    const map = new Map<number, Subscription[]>();
    for (const sub of subscriptions ?? []) {
      const list = map.get(sub.billing_day) ?? [];
      list.push(sub);
      map.set(sub.billing_day, list);
    }
    return map;
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorAlert message={errorMessage ?? "Impossible de charger le calendrier."} onRetry={onRetry} />;
  }

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, i) => {
          const events = cell.day ? byDay.get(cell.day) ?? [] : [];
          const isToday =
            cell.day === today.getDate() && month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
          return (
            <CalendarCell key={i} day={cell.day} inMonth={cell.inMonth} isToday={isToday} events={events} currency={currency} />
          );
        })}
      </div>
    </div>
  );
}

function CalendarCell({
  day,
  inMonth,
  isToday,
  events,
  currency,
}: {
  day: number | null;
  inMonth: boolean;
  isToday: boolean;
  events: Subscription[];
  currency: Currency;
}) {
  return (
    <div
      className={cn(
        "min-h-20 rounded-md border p-1.5 text-left",
        inMonth ? "border-border bg-surface" : "border-transparent bg-transparent opacity-40",
        isToday && "border-primary ring-1 ring-primary/40"
      )}
    >
      {day && <span className="text-xs font-medium text-text-muted">{day}</span>}
      <div className="mt-1 space-y-1">
        {events.slice(0, 2).map((sub) => (
          <CalendarEvent key={sub.id} subscription={sub} currency={currency} />
        ))}
        {events.length > 2 && <p className="text-[10px] text-text-muted">+{events.length - 2} autres</p>}
      </div>
    </div>
  );
}

function CalendarEvent({ subscription, currency }: { subscription: Subscription; currency: Currency }) {
  return (
    <div className="truncate rounded-sm bg-primary-light px-1 py-0.5 text-[10px] font-medium text-primary" title={subscription.name}>
      {subscription.name} · {formatPrice(subscription.price, currency)}
    </div>
  );
}

function buildMonthCells(month: Date): { day: number | null; inMonth: boolean }[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // lundi = 0

  const cells: { day: number | null; inMonth: boolean }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inMonth: true });
  while (cells.length % 7 !== 0) cells.push({ day: null, inMonth: false });
  return cells;
}
