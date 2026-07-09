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

/** Affiche BankConnectPromptModal une seule fois par compte, à la première
 * connexion : après acceptation de la charte (charter_accepted_at non nul,
 * pour ne jamais empiler deux modales bloquante/non-bloquante) et tant que
 * la banque n'est pas déjà connectée. Le "vu" est mémorisé en LocalStorage
 * (pas de champ backend dédié, contrairement à charter_accepted_at) pour ne
 * plus jamais relancer l'invite une fois passée ou traitée, même après un
 * "Plus tard". La page /bank-connect propose déjà ce geste explicitement,
 * inutile d'y superposer la pop-up. */
export function BankConnectPromptGate() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const bankConnectUrl = useBankConnectUrl();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user || !user.charter_accepted_at || user.bank_connected) return;
    if (pathname === "/bank-connect") return;
    if (localStorage.getItem(storageKey(user.id))) return;
    setOpen(true);
  }, [user, pathname]);

  function markSeen() {
    if (user) localStorage.setItem(storageKey(user.id), "1");
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
