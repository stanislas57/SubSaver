import * as React from "react";
import { useIsPremium } from "@/hooks/useIsPremium";
import { UpgradeModal, type UpgradeModalProps } from "@/components/shared/UpgradeModal";

export interface PremiumGateProps {
  /** Contenu du paywall si l'utilisateur n'est pas Premium. */
  feature: Pick<UpgradeModalProps, "icon" | "title" | "description" | "benefits">;
  /** Render prop : reçoit le statut Premium et `guard`, qui transforme une
   * action en "l'action si Premium, sinon ouvre le paywall" -- évite de
   * répéter le if (!isPremium) { ... } else { ... } à chaque bouton
   * Premium/BtoB (cf. les 4 tuiles Espace Pro de PremiumPage.tsx). */
  children: (state: { isPremium: boolean; guard: (action: () => void) => () => void }) => React.ReactNode;
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const isPremium = useIsPremium();
  const [showUpgrade, setShowUpgrade] = React.useState(false);

  function guard(action: () => void): () => void {
    return isPremium ? action : () => setShowUpgrade(true);
  }

  return (
    <>
      {children({ isPremium, guard })}
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} {...feature} />
    </>
  );
}
