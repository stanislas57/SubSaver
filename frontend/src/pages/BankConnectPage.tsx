import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBankConnectUrl, useSyncTransactions } from "@/hooks/useBank";
import { useMagnetic } from "@/hooks/useMagnetic";
import { RevealText } from "@/components/shared/RevealText";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/api/axiosClient";

/** Page dédiée à la connexion bancaire (flow réel Powens) : design épuré,
 * un unique geste au centre de l'écran, façon intégration Plaid/Bridge. */
export function BankConnectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bankConnectUrl = useBankConnectUrl();
  const syncTransactions = useSyncTransactions();
  const magneticRef = useMagnetic<HTMLButtonElement>(0.25, 16);

  function handleConnect() {
    bankConnectUrl.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.webview_url;
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  /** Banque déjà connectée : le geste n'a plus de sens pour une PREMIÈRE
   * connexion (bug QA -- le bouton disait "Connecter" même une fois
   * connecté). Il relance une synchronisation des transactions, puis
   * renvoie vers Abonnements pour lancer la détection. */
  function handleResync() {
    syncTransactions.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`${data.synced_count} nouvelle(s) transaction(s) synchronisée(s).`);
        navigate("/subscriptions");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-luxury-bg px-6 text-center">
      <RevealText as="h1" className="max-w-lg text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
        {user?.bank_connected ? "Ta banque est connectée" : "Sécurise ta connexion bancaire"}
      </RevealText>
      <RevealText className="mt-4 max-w-md text-base text-luxury-text-light">
        {user?.bank_connected
          ? "Tes transactions sont synchronisées automatiquement. Tu peux relancer une détection à tout moment."
          : "Un seul geste pour connecter ta banque et laisser SubServer isoler tes abonnements récurrents."}
      </RevealText>

      {user?.bank_connected ? (
        // Bouton secondaire, volontairement moins proéminent que le geste de
        // première connexion : la banque est déjà connectée, il ne reste
        // qu'une action de maintenance, pas un moment clé du parcours.
        <Button
          variant="outline"
          size="lg"
          className="mt-12"
          onClick={handleResync}
          loading={syncTransactions.isPending}
        >
          <RefreshCw className="h-4 w-4" /> Relancer une synchronisation
        </Button>
      ) : (
        <button
          ref={magneticRef}
          onClick={handleConnect}
          disabled={bankConnectUrl.isPending}
          style={{ willChange: "transform" }}
          className="group relative mt-12 flex h-40 w-40 items-center justify-center rounded-full bg-luxury-night text-white shadow-[0_0_0_0_rgba(10,17,40,0)] transition-shadow duration-300 hover:shadow-[0_0_60px_10px_rgba(212,175,55,0.35)] disabled:opacity-60"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-luxury-gold/20" />
          <span className="relative flex flex-col items-center gap-1 text-sm font-semibold">
            {bankConnectUrl.isPending ? (
              "Connexion..."
            ) : (
              <>
                <Lock className="h-5 w-5 text-luxury-gold" />
                Connecter
                <ArrowRight className="h-4 w-4 text-luxury-gold" />
              </>
            )}
          </span>
        </button>
      )}

      <div className="mt-14 flex flex-col items-center gap-2 text-xs text-luxury-text-light">
        <p className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Connexion chiffrée de bout en bout, via Powens (agréé DSP2)
        </p>
        <p className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          Tes identifiants bancaires ne transitent jamais par nos serveurs
        </p>
      </div>
    </div>
  );
}
