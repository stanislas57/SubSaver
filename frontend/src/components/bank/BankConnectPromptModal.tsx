import { Landmark, ShieldCheck, Lock, Ban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface BankConnectPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => void;
  onSkip: () => void;
  connecting?: boolean;
}

/** Pop-up affiché à la toute première connexion (avant toute connexion
 * bancaire) pour inviter l'utilisateur à connecter sa banque et laisser
 * SubServer isoler ses abonnements récurrents. Non-bloquant : "Plus tard"
 * (et la croix) ferment simplement la modale sans empêcher l'accès au
 * site, contrairement à CharterModal. Cf. BankConnectPromptGate pour la
 * logique de "une seule fois par compte" (LocalStorage) et l'appel réel
 * à l'API bancaire (Powens, DSP2). */
export function BankConnectPromptModal({ open, onOpenChange, onConnect, onSkip, connecting }: BankConnectPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onSkip()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-luxury-night text-luxury-gold">
            <Landmark className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Trouvons vos abonnements cachés</DialogTitle>
          <DialogDescription>
            Connectez votre banque pour que SubServer repère automatiquement vos prélèvements récurrents — et vous
            propose des économies concrètes en quelques secondes.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 text-sm text-luxury-text-light">
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-luxury-gold-deep" />
            Connexion 100% sécurisée et chiffrée, encadrée par la norme européenne DSP2.
          </li>
          <li className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-luxury-gold-deep" />
            Accès en lecture seule : nous consultons vos transactions, jamais vos identifiants bancaires.
          </li>
          <li className="flex items-start gap-2.5">
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-luxury-gold-deep" />
            Aucun virement, aucun paiement possible depuis SubServer.
          </li>
        </ul>

        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-luxury-text-light transition-colors hover:text-luxury-text"
          >
            Plus tard
          </button>
          <Button onClick={onConnect} loading={connecting} className="w-full sm:w-auto">
            Connecter ma banque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
