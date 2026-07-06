import { Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { formatPrice } from "@/lib/format";
import type { Currency, DetectedSubscription } from "@/types";

const FREQUENCY_LABELS: Record<DetectedSubscription["frequency"], string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

export interface BankReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: DetectedSubscription[];
  currency: Currency;
  onExclude: (candidate: DetectedSubscription) => void;
  onValidate: () => void;
  validating?: boolean;
}

/** Étape 2 (rapport) + étape 3 (validation) du tunnel de détection bancaire :
 * liste tout ce qui a été trouvé avec sa catégorie, l'utilisateur peut retirer
 * un candidat avant de tout intégrer d'un coup à son tableau de bord. */
export function BankReportModal({
  open,
  onOpenChange,
  candidates,
  currency,
  onExclude,
  onValidate,
  validating,
}: BankReportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Rapport de détection
          </DialogTitle>
          <DialogDescription>
            {candidates.length > 0
              ? `${candidates.length} abonnement(s) récurrent(s) détecté(s) dans tes transactions.`
              : "Aucun abonnement récurrent détecté pour l'instant."}
          </DialogDescription>
        </DialogHeader>

        {candidates.length > 0 && (
          <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
            {candidates.map((c) => (
              <li
                key={`${c.merchant}-${c.frequency}-${c.price}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-900/10 bg-white shadow-sm p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-luxury-text">{c.merchant}</p>
                    <CategoryBadge category={c.category} />
                  </div>
                  <p className="mt-1 text-sm text-luxury-text-light">
                    {formatPrice(c.price, currency)} · {FREQUENCY_LABELS[c.frequency]} · {Math.round(c.confidence * 100)}% confiance
                  </p>
                </div>
                <button
                  onClick={() => onExclude(c)}
                  aria-label={`Retirer ${c.merchant} du rapport`}
                  className="shrink-0 rounded-lg p-2 text-luxury-text-light transition-colors hover:bg-slate-100 hover:text-luxury-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
          {candidates.length > 0 && (
            <Button onClick={onValidate} loading={validating}>
              Intégrer au tableau de bord
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
