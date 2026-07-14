import * as React from "react";
import { ShieldCheck, ScanSearch, TrendingUp, Ghost, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface BankConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
  loading?: boolean;
}

const TIPS = [
  {
    icon: TrendingUp,
    text: "Une hausse de prix passe rarement inaperçue sur un relevé - SubSaver compare chaque prélèvement à son historique pour la repérer.",
  },
  {
    icon: Ghost,
    text: "Essai gratuit oublié, service jamais résilié : le prélèvement continue même quand l'usage a cessé.",
  },
  {
    icon: Lock,
    text: "Aucune donnée n'est partagée avec un tiers pendant l'analyse - tout reste entre ta banque et SubSaver.",
  },
  {
    icon: ScanSearch,
    text: "L'algorithme isole les montants qui reviennent à intervalle régulier, pas seulement ceux libellés \"abonnement\".",
  },
];

/** Contenu affiché pendant l'analyse (sync + détection), à la place d'un
 * simple bouton en chargement : rotation de tips éducatifs toutes les 3s,
 * pour occuper l'attente perçue plutôt que de la laisser vide. */
function ScanningView() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), 3000);
    return () => clearInterval(id);
  }, []);

  const tip = TIPS[index];
  const Icon = tip.icon;

  return (
    <div className="py-2">
      <div className="flex items-center justify-center gap-2 py-4">
        {TIPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-luxury-gold" : "w-1.5 bg-slate-900/10"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex min-h-[92px] items-start gap-3 rounded-xl bg-luxury-bg/60 p-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-luxury-night text-luxury-gold">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <p className="text-sm leading-relaxed text-luxury-text-light">{tip.text}</p>
        </motion.div>
      </AnimatePresence>

      <p className="mt-4 text-center text-xs font-medium text-luxury-text-light">
        Analyse de tes transactions en cours…
      </p>
    </div>
  );
}

/** Étape 1 du tunnel de détection bancaire : consentement explicite avant
 * de lancer l'algorithme d'analyse sur les transactions. Bascule sur
 * ScanningView pendant `loading` (sync + détection) au lieu de se contenter
 * d'un bouton avec un spinner. */
export function BankConsentModal({ open, onOpenChange, onConsent, loading }: BankConsentModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent hideCloseButton={loading}>
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <DialogTitle>{loading ? "Détection en cours" : "Autoriser la détection des abonnements ?"}</DialogTitle>
          {!loading && (
            <DialogDescription>
              SubSaver va analyser les transactions synchronisées depuis ta banque pour isoler les paiements
              récurrents et te proposer de les ajouter à ton tableau de bord. Aucune donnée n'est partagée avec un
              tiers.
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <ScanningView />
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onConsent}>J'autorise la détection</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
