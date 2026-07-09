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
  /** Appelé dès que ce gate n'a plus rien à afficher -- soit immédiatement
   * (déjà vu, banque déjà connectée, charte pas encore acceptée), soit après
   * un choix ou une fermeture. AppLayout n'affiche BankConnectPromptGate
   * qu'une fois ce signal reçu, pour ne jamais superposer les deux pop-ups
   * non-bloquantes à la première connexion. */
  onSettled: () => void;
}

/** Affiche GoalModal une seule fois par compte, entre l'acceptation de la
 * charte et l'invite de connexion bancaire. Le choix est mémorisé en
 * LocalStorage, comme BankConnectPromptGate : aucun champ backend dédié
 * n'existe pour l'objectif, donc pas de personnalisation serveur pour
 * l'instant -- seulement une trace locale. */
export function GoalGate({ onSettled }: GoalGateProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = React.useState(false);
  const settledRef = React.useRef(false);

  function settle() {
    if (settledRef.current) return;
    settledRef.current = true;
    onSettled();
  }

  React.useEffect(() => {
    if (!user) return;
    if (!user.charter_accepted_at || user.bank_connected || pathname === "/bank-connect") {
      settle();
      return;
    }
    if (localStorage.getItem(seenKey(user.id))) {
      settle();
      return;
    }
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pathname]);

  function markSeen() {
    if (user) localStorage.setItem(seenKey(user.id), "1");
    settle();
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
