import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/api/axiosClient";

const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

export function CalendarPage() {
  const { user } = useAuth();
  const [month, setMonth] = React.useState(() => new Date());
  const subscriptionsQuery = useSubscriptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold capitalize text-text-main">{MONTH_FORMAT.format(month)}</h2>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CalendarGrid
        month={month}
        subscriptions={subscriptionsQuery.data}
        isLoading={subscriptionsQuery.isPending}
        isError={subscriptionsQuery.isError}
        errorMessage={subscriptionsQuery.error ? getErrorMessage(subscriptionsQuery.error) : undefined}
        onRetry={() => subscriptionsQuery.refetch()}
        currency={user?.currency ?? "EUR"}
      />
    </div>
  );
}
