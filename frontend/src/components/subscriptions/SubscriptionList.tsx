import { ListChecks } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { SubscriptionListItem } from "@/components/subscriptions/SubscriptionListItem";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import type { Subscription, Currency } from "@/types";

export interface SubscriptionListProps {
  subscriptions: Subscription[] | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  currency: Currency;
  onEdit?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
  onAdd: () => void;
  deletingId?: string;
}

export function SubscriptionList({
  subscriptions,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  currency,
  onEdit,
  onDelete,
  onAdd,
  deletingId,
}: SubscriptionListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-14" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-5">
          <ErrorAlert message={errorMessage ?? "Impossible de charger tes abonnements."} onRetry={onRetry} />
        </CardContent>
      </Card>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <EmptyState
        icon={<ListChecks className="h-6 w-6" />}
        title="Aucun abonnement pour l'instant"
        description="Ajoute ton premier abonnement manuellement ou synchronise ta banque pour les détecter automatiquement."
        actionLabel="Ajouter un abonnement"
        onAction={onAdd}
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {subscriptions.map((sub) => (
            <motion.div key={sub.id} variants={fadeInUp}>
              <SubscriptionListItem
                subscription={sub}
                currency={currency}
                onEdit={onEdit}
                onDelete={onDelete}
                deleting={deletingId === sub.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}
