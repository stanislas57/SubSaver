import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBankCallback, useDetectSubscriptions, useSyncTransactions } from "@/hooks/useBank";
import { getErrorMessage } from "@/api/axiosClient";
import type { DetectedSubscription } from "@/types";

/** Délai avant de proposer le scan post-connexion bancaire (cf.
 * BankScanPromptModal) : le temps que le toast de succès s'affiche et que
 * l'utilisateur assimile que sa banque est bien connectée. */
const SCAN_PROMPT_DELAY_MS = 2000;

interface SubscriptionDetectionValue {
  consentOpen: boolean;
  scanPromptOpen: boolean;
  reportOpen: boolean;
  candidates: DetectedSubscription[];
  isScanning: boolean;
  openConsent: () => void;
  setConsentOpen: (open: boolean) => void;
  setScanPromptOpen: (open: boolean) => void;
  handleScanPromptCta: () => void;
  runDetection: () => void;
  excludeCandidate: (candidate: DetectedSubscription) => void;
  setReportOpen: (open: boolean) => void;
  clearCandidates: () => void;
}

const SubscriptionDetectionContext = React.createContext<SubscriptionDetectionValue | null>(null);

/** Isole tout le tunnel de détection d'abonnements (consentement -> sync ->
 * algorithme -> rapport à valider) du reste de l'application : ce provider
 * est monté une seule fois dans AppLayout, AU-DESSUS du <Outlet/> re-keyé par
 * pathname (cf. AnimatePresence dans AppLayout.tsx) qui remonte chaque page
 * à chaque navigation. Avant ce découplage, cet état (candidats détectés,
 * modale ouverte, mutation en cours) vivait en useState LOCAL à
 * SubscriptionsPage : n'importe quelle navigation -- même sans rapport avec
 * la détection -- démontait la page et perdait un scan en cours ou son
 * résultat, ce qui donnait l'impression que le détecteur "sautait". Ici,
 * l'état et les mutations survivent tant que la session authentifiée reste
 * active, quoi qu'il se passe ailleurs dans l'app. */
export function SubscriptionDetectionProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const bankCallback = useBankCallback();
  const syncTransactions = useSyncTransactions();
  const detectSubscriptions = useDetectSubscriptions();

  const [consentOpen, setConsentOpen] = React.useState(false);
  const [scanPromptOpen, setScanPromptOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [candidates, setCandidates] = React.useState<DetectedSubscription[]>([]);

  function openConsent() {
    setConsentOpen(true);
  }

  function handleScanPromptCta() {
    setScanPromptOpen(false);
    openConsent();
  }

  /** Tunnel de détection en 2 appels réseau enchaînés (sync des transactions
   * PUIS analyse), chacun avec sa propre gestion d'erreur : un échec de
   * l'étape 1 (banque indisponible) n'enchaîne jamais sur l'étape 2. Les
   * console.log tracent chaque étape clé (préfixe [detect] partagé avec les
   * logs backend) pour repérer où la donnée se perd le cas échéant. */
  function runDetection() {
    console.log("[detect] Étape 2 : synchronisation des transactions bancaires…");
    syncTransactions.mutate(undefined, {
      onError: (error) => {
        console.error("[detect] échec de la synchronisation des transactions :", error);
        toast.error(getErrorMessage(error));
        setConsentOpen(false);
      },
      onSuccess: (syncResult) => {
        console.log("[detect] transactions synchronisées :", syncResult);
        console.log("[detect] Étape 3 : lancement de l'analyse de détection…");
        detectSubscriptions.mutate(undefined, {
          onSuccess: (data) => {
            console.log(`[detect] Étape 4 : ${data.length} candidat(s) reçu(s) du backend`, data);
            setCandidates(data);
            setConsentOpen(false);
            setReportOpen(true);
          },
          onError: (error) => {
            console.error("[detect] échec de l'analyse de détection :", error);
            toast.error(getErrorMessage(error));
            setConsentOpen(false);
          },
        });
      },
    });
  }

  function excludeCandidate(candidate: DetectedSubscription) {
    setCandidates((prev) => prev.filter((c) => c.merchant !== candidate.merchant));
  }

  function clearCandidates() {
    setCandidates([]);
  }

  /** Au retour de la Webview Powens, l'URL contient state/connection_id/error
   * en query params. Monté une seule fois au niveau du provider (et non de
   * SubscriptionsPage) : indépendant de la page sur laquelle l'utilisateur
   * atterrit après le redirect, et ne se redéclenche pas à chaque visite de
   * /subscriptions. */
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("state");
    if (!state) return;

    let scanPromptTimer: ReturnType<typeof setTimeout> | undefined;

    bankCallback.mutate(
      {
        state,
        connection_id: params.get("connection_id") ?? undefined,
        error: params.get("error") ?? undefined,
        error_description: params.get("error_description") ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success("Banque connectée avec succès.");
          scanPromptTimer = setTimeout(() => setScanPromptOpen(true), SCAN_PROMPT_DELAY_MS);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
        onSettled: () => navigate("/subscriptions", { replace: true }),
      },
    );

    return () => clearTimeout(scanPromptTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: SubscriptionDetectionValue = {
    consentOpen,
    scanPromptOpen,
    reportOpen,
    candidates,
    isScanning: syncTransactions.isPending || detectSubscriptions.isPending,
    openConsent,
    setConsentOpen,
    setScanPromptOpen,
    handleScanPromptCta,
    runDetection,
    excludeCandidate,
    setReportOpen,
    clearCandidates,
  };

  return <SubscriptionDetectionContext.Provider value={value}>{children}</SubscriptionDetectionContext.Provider>;
}

export function useSubscriptionDetection(): SubscriptionDetectionValue {
  const ctx = React.useContext(SubscriptionDetectionContext);
  if (!ctx) throw new Error("useSubscriptionDetection doit être utilisé à l'intérieur d'un <SubscriptionDetectionProvider>.");
  return ctx;
}
