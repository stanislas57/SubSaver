import { PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface PremiumWelcomeModalProps {
  open: boolean;
  onClose: () => void;
  confirming?: boolean;
}

/** Pop-up de bienvenue au retour de Stripe : bloque l'interface en arrière-plan
 * (Dialog modal classique) et n'appelle onClose qu'une seule fois, quelle que
 * soit la façon dont l'utilisateur ferme la fenêtre (bouton, Échap, clic
 * extérieur) -- toutes ces actions valent confirmation de bienvenue. */
export function PremiumWelcomeModal({ open, onClose, confirming }: PremiumWelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="text-center">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-luxury-night text-luxury-gold">
            <PartyPopper className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl">Merci de votre confiance et bienvenue chez SubSaver Premium</DialogTitle>
          <DialogDescription>
            Toutes les fonctionnalités Premium et BtoB sont désormais débloquées sur ton compte.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="justify-center">
          <Button onClick={onClose} loading={confirming} className="w-full sm:w-auto">
            Découvrir mon espace Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
