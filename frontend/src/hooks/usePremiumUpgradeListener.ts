import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/** Capte le retour de paiement Stripe quelle que soit la page sur laquelle
 * il atterrit : si l'URL contient `?premium=true` (paramètre à ajouter à
 * l'URL de redirection "après paiement" configurée dans le dashboard
 * Stripe, quelle qu'elle soit -- racine du site, /overview, /dashboard...),
 * confirme l'upgrade Premium, affiche le toast de bienvenue, puis nettoie
 * le paramètre de l'URL pour éviter un nouveau déclenchement au refresh.
 *
 * Complète /success (qui reste la redirection recommandée pour la petite
 * animation de déverrouillage) sans lui être redondant : si l'upgrade a déjà
 * été confirmé via /success, `user.is_premium` est déjà `true` ici et ce
 * hook ne fait rien. */
export function usePremiumUpgradeListener() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, confirmPremiumUpgrade } = useAuth();
  const triggeredRef = React.useRef(false);

  React.useEffect(() => {
    const shouldUpgrade = searchParams.get("premium") === "true";
    if (!shouldUpgrade || user?.is_premium || triggeredRef.current) return;
    triggeredRef.current = true;

    confirmPremiumUpgrade()
      .then(() => toast.success("Bienvenue dans SubServer Pro"))
      .catch(() => {
        triggeredRef.current = false;
      })
      .finally(() => {
        const next = new URLSearchParams(searchParams);
        next.delete("premium");
        setSearchParams(next, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.is_premium]);
}
