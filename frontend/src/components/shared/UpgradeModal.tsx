import * as React from "react";
import { Check, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STRIPE_BILLING_URL } from "@/api/config";

export interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  /** Bénéfices clés de CETTE fonctionnalité, affichés en liste à puces --
   * jamais un message générique "Passe Premium", cf. consigne UX (l'écran
   * doit vendre l'outil que l'utilisateur vient réellement de cliquer). */
  benefits?: string[];
}

/** Paywall contextuel affiché au clic sur une action Premium/BtoB par un
 * compte non-Premium -- remplace la redirection Stripe instantanée et muette
 * utilisée ailleurs dans l'app (PremiumPage, PremiumUpsellScreen) : ici
 * l'utilisateur voit la valeur réelle de l'outil avant de décider de payer. */
export function UpgradeModal({
  open,
  onOpenChange,
  icon: Icon = Lock,
  title,
  description,
  benefits = [],
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
            <Icon className="h-5 w-5" />
          </div>
          <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-luxury-night px-3 py-1 text-xs font-semibold uppercase tracking-wide text-luxury-gold">
            Fonctionnalité Premium
          </span>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {benefits.length > 0 && (
          <ul className="space-y-2 py-2">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-luxury-text-light">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-luxury-gold-deep" />
                {benefit}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
          <Button variant="premium" onClick={() => (window.location.href = STRIPE_BILLING_URL)}>
            Passer Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
