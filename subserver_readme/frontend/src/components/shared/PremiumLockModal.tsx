import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STRIPE_BILLING_URL } from "@/api/config";

export interface PremiumLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

export function PremiumLockModal({ open, onOpenChange, feature }: PremiumLockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-emerald-50 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle>Fonctionnalité Premium</DialogTitle>
          <DialogDescription>
            {feature} est réservé aux membres Premium. Passe au Premium pour débloquer le comparateur, l'abonnement
            partagé illimité et les exports avancés.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
          <Button variant="premium" onClick={() => window.open(STRIPE_BILLING_URL, "_blank")}>
            Passer Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
