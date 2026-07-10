import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumWelcomeModal } from "@/components/shared/PremiumWelcomeModal";

export interface PremiumWelcomeGateProps {
  /** Ce gate ne décide s'il doit s'afficher que lorsqu'il est actif -- cf.
   * useGateSequencer (orchestré depuis AppLayout), qui garantit qu'un seul
   * gate d'activation est à l'écran à la fois. */
  active: boolean;
  onSettled: (didShow: boolean) => void;
}

/** Capte le retour de paiement Stripe quelle que soit la page authentifiée
 * sur laquelle il atterrit : si l'URL contient `?success=true` (ou
 * `?premium=true`, alias historique), affiche le pop-up de bienvenue et
 * bloque l'interface en arrière-plan. L'upgrade n'est confirmée côté
 * backend (isPremium -> true) qu'à la fermeture du pop-up, comme demandé --
 * pas avant, pour que l'ouverture du pop-up soit bien le moment de bascule
 * perçu par l'utilisateur. */
export function PremiumWelcomeGate({ active, onSettled }: PremiumWelcomeGateProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, confirmPremiumUpgrade, isConfirmingPremium } = useAuth();
  const [open, setOpen] = React.useState(false);
  // decidedRef : empêche l'effet de re-décider une fois qu'il a choisi
  // d'afficher (ou non) le pop-up. settledRef : empêche onSettled d'être
  // appelé deux fois -- deux gardes distinctes, la décision d'afficher
  // pouvant précéder de longtemps l'appel réel à onSettled (qui n'arrive
  // qu'à la fermeture du pop-up par l'utilisateur).
  const decidedRef = React.useRef(false);
  const settledRef = React.useRef(false);

  function settle(didShow: boolean) {
    if (settledRef.current) return;
    settledRef.current = true;
    onSettled(didShow);
  }

  React.useEffect(() => {
    if (!active || decidedRef.current) return;
    const shouldWelcome = searchParams.get("success") === "true" || searchParams.get("premium") === "true";
    if (!shouldWelcome || user?.is_premium) {
      decidedRef.current = true;
      settle(false);
      return;
    }
    decidedRef.current = true;
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, searchParams, user?.is_premium]);

  function handleClose() {
    confirmPremiumUpgrade().finally(() => {
      setOpen(false);
      const next = new URLSearchParams(searchParams);
      next.delete("success");
      next.delete("premium");
      setSearchParams(next, { replace: true });
      settle(true);
    });
  }

  return <PremiumWelcomeModal open={open} onClose={handleClose} confirming={isConfirmingPremium} />;
}
