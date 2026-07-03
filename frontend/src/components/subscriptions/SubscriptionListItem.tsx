import { Pencil, Trash2 } from "lucide-react";
import { LogoWithFallback } from "@/components/shared/LogoWithFallback";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { ImportanceBadge } from "@/components/shared/ImportanceBadge";
import { Button } from "@/components/ui/button";
import { formatPrice, billingDayLabel } from "@/lib/format";
import type { Subscription, Currency } from "@/types";

export interface SubscriptionListItemProps {
  subscription: Subscription;
  currency: Currency;
  onEdit?: (subscription: Subscription) => void;
  onDelete?: (subscription: Subscription) => void;
  deleting?: boolean;
}

export function SubscriptionListItem({ subscription, currency, onEdit, onDelete, deleting }: SubscriptionListItemProps) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-1 py-3 last:border-b-0">
      <LogoWithFallback domain={subscription.domain} name={subscription.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-text-main">{subscription.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={subscription.category} />
          <ImportanceBadge importance={subscription.importance} />
          <span className="text-xs text-text-muted">{billingDayLabel(subscription.billing_day)}</span>
        </div>
      </div>
      <p className="shrink-0 font-display text-base font-bold text-text-main">
        {formatPrice(subscription.price, currency)}
      </p>
      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(subscription)} aria-label="Modifier">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(subscription)}
              loading={deleting}
              aria-label="Supprimer"
              className="hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
