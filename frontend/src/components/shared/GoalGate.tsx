import * as React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GoalModal, type Goal } from "@/components/shared/GoalModal";

function seenKey(userId: string) {
  return `subsaver_goal_seen_${userId}`;
}
function goalKey(userId: string) {
  return `subsaver_goal_${userId}`;
}

export interface GoalGateProps {
  /** Ce gate ne décide s'il doit s'afficher que lorsqu'il est actif -- cf.
   * useGateSequencer (orchestré depuis AppLayout), qui garantit qu'un seul
   * gate d'activation est à l'écran à la fois, avec un délai minimum entre
   * deux pop-ups successifs. */
  active: boolean;
  onSettled: (didShow: boolean) => void;
}

/** Affiche GoalModal une seule fois par compte, entre l'acceptation de la
 * charte et l'invite de connexion bancaire. Le choix est mémorisé en
 * LocalStorage, comme BankConnectPromptGate : aucun champ backend dédié
 * n'existe pour l'objectif, donc pas de personnalisation serveur pour
 * l'instant -- seulement une trace locale. */
export function GoalGate({ active, onSettled }: GoalGateProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);
  // decidedRef : empêche l'effet de re-décider une fois le pop-up ouvert.
  // settledRef : empêche onSettled d'être appelé deux fois.
  const decidedRef = React.useRef(false);
  const settledRef = React.useRef(false);

  function settle(didShow: boolean) {
    if (settledRef.current) return;
    settledRef.current = true;
    onSettled(didShow);
  }

  React.useEffect(() => {
    if (!active || !user || decidedRef.current) return;
    // Charte pas encore acceptée : pas encore prêt à décider, on ne
    // "consomme" pas le tour -- l'effet se redéclenchera une fois
    // charter_accepted_at renseigné (cf. le même piège corrigé sur
    // BankConnectPromptGate).
    if (!user.charter_accepted_at) return;
    if (user.bank_connected || pathname === "/bank-connect") {
      decidedRef.current = true;
      settle(false);
      return;
    }
    if (localStorage.getItem(seenKey(user.id))) {
      decidedRef.current = true;
      settle(false);
      return;
    }
    decidedRef.current = true;
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, user, pathname]);

  function markSeen() {
    if (user) localStorage.setItem(seenKey(user.id), "1");
    settle(true);
  }

  function handleSelect(goal: Goal) {
    if (user) localStorage.setItem(goalKey(user.id), goal);
    markSeen();
    setOpen(false);
  }

  if (!user) return null;

  return (
    <GoalModal
      open={open}
      onOpenChange={(next) => {
        if (!next) markSeen();
        setOpen(next);
      }}
      onSelect={handleSelect}
    />
  );
}
