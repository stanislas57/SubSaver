import * as React from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBankConnectUrl } from "@/hooks/useBank";
import { getErrorMessage } from "@/api/axiosClient";
import { BankConnectPromptModal } from "@/components/bank/BankConnectPromptModal";

function storageKey(userId: string) {
  return `subsaver_bank_prompt_seen_${userId}`;
}

export interface BankConnectPromptGateProps {
  /** Ce gate ne décide s'il doit s'afficher que lorsqu'il est actif -- cf.
   * useGateSequencer (orchestré depuis AppLayout), qui garantit qu'un seul
   * gate d'activation est à l'écran à la fois. */
  active: boolean;
  onSettled: (didShow: boolean) => void;
}

/** Affiche BankConnectPromptModal une seule fois par compte, à la première
 * connexion : après acceptation de la charte (charter_accepted_at non nul)
 * et tant que la banque n'est pas déjà connectée. Le "vu" est mémorisé en
 * LocalStorage (pas de champ backend dédié, contrairement à
 * charter_accepted_at) pour ne plus jamais relancer l'invite une fois passée
 * ou traitée, même après un "Plus tard". La page /bank-connect propose déjà
 * ce geste explicitement, inutile d'y superposer la pop-up. */
export function BankConnectPromptGate({ active, onSettled }: BankConnectPromptGateProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const bankConnectUrl = useBankConnectUrl();
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
    // charter_accepted_at renseigné.
    if (!user.charter_accepted_at) return;
    if (user.bank_connected || pathname === "/bank-connect") {
      decidedRef.current = true;
      settle(false);
      return;
    }
    if (localStorage.getItem(storageKey(user.id))) {
      decidedRef.current = true;
      settle(false);
      return;
    }
    decidedRef.current = true;
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, user, pathname]);

  function markSeen() {
    if (user) localStorage.setItem(storageKey(user.id), "1");
    settle(true);
  }

  function handleConnect() {
    bankConnectUrl.mutate(undefined, {
      onSuccess: (data) => {
        markSeen();
        window.location.href = data.webview_url;
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleSkip() {
    markSeen();
    setOpen(false);
  }

  if (!user) return null;

  return (
    <BankConnectPromptModal
      open={open}
      onOpenChange={setOpen}
      onConnect={handleConnect}
      onSkip={handleSkip}
      connecting={bankConnectUrl.isPending}
    />
  );
}
