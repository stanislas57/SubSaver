import { ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface BankConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
  loading?: boolean;
}

/** Étape 1 du tunnel de détection bancaire : consentement explicite avant
 * de lancer l'algorithme d'analyse sur les transactions. */
export function BankConsentModal({ open, onOpenChange, onConsent, loading }: BankConsentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-slate-50">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <DialogTitle>Autoriser la détection des abonnements ?</DialogTitle>
          <DialogDescription>
            SubServer va analyser les transactions synchronisées depuis ta banque pour isoler les paiements
            récurrents et te proposer de les ajouter à ton tableau de bord. Aucune donnée n'est partagée avec un
            tiers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={onConsent} loading={loading}>
            J'autorise la détection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
