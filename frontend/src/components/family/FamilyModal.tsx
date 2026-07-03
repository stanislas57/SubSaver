import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FamilyTabs } from "@/components/family/FamilyTabs";
import type { Currency } from "@/types";

export interface FamilyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: Currency;
}

export function FamilyModal({ open, onOpenChange, currency }: FamilyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Mode Famille</DialogTitle>
          <DialogDescription>Partage tes abonnements et répartis les coûts entre les membres du foyer.</DialogDescription>
        </DialogHeader>
        <FamilyTabs currency={currency} />
      </DialogContent>
    </Dialog>
  );
}
