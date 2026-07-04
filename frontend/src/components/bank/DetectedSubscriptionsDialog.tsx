import * as React from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { DetectedSubscription } from "@/types";

const FREQUENCY_LABELS: Record<DetectedSubscription["frequency"], string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

/** Devine un domaine web plausible à partir du nom marchand, pour le logo. */
function guessDomain(merchant: string): string {
  const lower = merchant.toLowerCase().trim();
  if (lower.includes(".")) return lower.replace(/\s+/g, "");
  return `${lower.replace(/\s+/g, "")}.com`;
}

interface DetectedSubscriptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: DetectedSubscription[];
  onAccept: (candidate: DetectedSubscription) => void;
  onReject: (candidate: DetectedSubscription) => void;
  acceptingMerchant?: string;
}

export function DetectedSubscriptionsDialog({
  open,
  onOpenChange,
  candidates,
  onAccept,
  onReject,
  acceptingMerchant,
}: DetectedSubscriptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Abonnements détectés
          </DialogTitle>
          <DialogDescription>
            Vérifie chaque suggestion issue de tes relevés bancaires avant de l'ajouter.
          </DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun abonnement récurrent détecté pour l'instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {candidates.map((c) => (
              <li
                key={`${c.merchant}-${c.frequency}-${c.price}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.merchant}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.price.toFixed(2)}€ · {FREQUENCY_LABELS[c.frequency]} · {c.occurrences} occurrences ·{" "}
                    {Math.round(c.confidence * 100)}% confiance
                  </p>
                  <p className="text-xs text-muted-foreground">Prochaine échéance estimée : {c.next_estimated_date}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label={`Accepter ${c.merchant}`}
                    loading={acceptingMerchant === c.merchant}
                    onClick={() => onAccept(c)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Rejeter ${c.merchant}`}
                    onClick={() => onReject(c)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { guessDomain };
