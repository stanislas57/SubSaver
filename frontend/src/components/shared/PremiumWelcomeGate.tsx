import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumWelcomeModal } from "@/components/shared/PremiumWelcomeModal";

/** Capte le retour de paiement Stripe quelle que soit la page authentifiée
 * sur laquelle il atterrit : si l'URL contient `?success=true` (ou
 * `?premium=true`, alias historique), affiche le pop-up de bienvenue et
 * bloque l'interface en arrière-plan. L'upgrade n'est confirmée côté
 * backend (isPremium -> true) qu'à la fermeture du pop-up, comme demandé --
 * pas avant, pour que l'ouverture du pop-up soit bien le moment de bascule
 * perçu par l'utilisateur. */
export function PremiumWelcomeGate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, confirmPremiumUpgrade, isConfirmingPremium } = useAuth();
  const [open, setOpen] = React.useState(false);
  const consumedRef = React.useRef(false);

  React.useEffect(() => {
    const shouldWelcome = searchParams.get("success") === "true" || searchParams.get("premium") === "true";
    if (!shouldWelcome || user?.is_premium || consumedRef.current) return;
    consumedRef.current = true;
    setOpen(true);
  }, [searchParams, user?.is_premium]);

  function handleClose() {
    confirmPremiumUpgrade().finally(() => {
      setOpen(false);
      const next = new URLSearchParams(searchParams);
      next.delete("success");
      next.delete("premium");
      setSearchParams(next, { replace: true });
    });
  }

  return <PremiumWelcomeModal open={open} onClose={handleClose} confirming={isConfirmingPremium} />;
}
