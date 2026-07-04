import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SharedSubscriptionTabs } from "@/components/shared-subscription/SharedSubscriptionTabs";
import type { Currency } from "@/types";

export interface SharedSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
}

export function SharedSubscriptionModal({ open, onOpenChange, currency }: SharedSubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Abonnement partagé</DialogTitle>
          <DialogDescription>Partage tes abonnements et répartis les coûts entre les membres du foyer.</DialogDescription>
        </DialogHeader>
        <SharedSubscriptionTabs currency={currency} />
      </DialogContent>
    </Dialog>
  );
}
