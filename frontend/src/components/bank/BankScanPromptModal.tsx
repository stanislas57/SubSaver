import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/motion";

export interface BankScanPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: () => void;
}

/** Affiché ~2s après la confirmation de connexion bancaire (cf. le
 * setTimeout dans SubscriptionsPage) pour enchaîner naturellement sur la
 * détection, pendant que l'utilisateur a encore le succès de la connexion en
 * tête. Non-bloquant : "Plus tard" ferme simplement la modale. Le CTA ouvre
 * le tunnel de détection existant (BankConsentModal -> sync + algo) plutôt
 * que de lancer l'analyse directement, pour ne pas contourner le
 * consentement explicite déjà requis avant de traiter les transactions. */
export function BankScanPromptModal({ open, onOpenChange, onScan }: BankScanPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <DialogHeader>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-luxury-night text-luxury-gold">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl">Ta banque est connectée !</DialogTitle>
            <DialogDescription>
              C'est le bon moment pour scanner ton compte : SubSaver va passer tes transactions au crible pour
              retrouver tous tes abonnements, même ceux que tu as oubliés.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-sm font-medium text-luxury-text-light transition-colors hover:text-luxury-text"
            >
              Plus tard
            </button>
            <Button onClick={onScan} className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4" /> Détecter mes abonnements
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
