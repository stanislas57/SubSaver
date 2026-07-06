import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBankConnectUrl } from "@/hooks/useBank";
import { useMagnetic } from "@/hooks/useMagnetic";
import { RevealText } from "@/components/shared/RevealText";
import { getErrorMessage } from "@/api/axiosClient";

/** Page dédiée à la connexion bancaire (flow réel Powens) : design épuré,
 * un unique geste au centre de l'écran, façon intégration Plaid/Bridge. */
export function BankConnectPage() {
  const { user } = useAuth();
  const bankConnectUrl = useBankConnectUrl();
  const magneticRef = useMagnetic<HTMLButtonElement>(0.25, 16);

  function handleConnect() {
    bankConnectUrl.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.webview_url;
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <RevealText as="h1" className="max-w-lg text-4xl font-black tracking-tight text-slate-50 sm:text-5xl">
        {user?.bank_connected ? "Ta banque est connectée" : "Sécurise ta connexion bancaire"}
      </RevealText>
      <RevealText className="mt-4 max-w-md text-base text-slate-400">
        {user?.bank_connected
          ? "Tes transactions sont synchronisées automatiquement. Tu peux relancer une détection à tout moment."
          : "Un seul geste pour connecter ta banque et laisser SubServer isoler tes abonnements récurrents."}
      </RevealText>

      <button
        ref={magneticRef}
        onClick={handleConnect}
        disabled={bankConnectUrl.isPending}
        className="group relative mt-12 flex h-40 w-40 items-center justify-center rounded-full bg-white text-black shadow-[0_0_0_0_rgba(255,255,255,0)] transition-shadow duration-300 hover:shadow-[0_0_60px_10px_rgba(255,255,255,0.25)] disabled:opacity-60"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
        <span className="relative flex flex-col items-center gap-1 text-sm font-semibold">
          {bankConnectUrl.isPending ? (
            "Connexion..."
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Connecter
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </span>
      </button>

      <div className="mt-14 flex flex-col items-center gap-2 text-xs text-gray-400">
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
