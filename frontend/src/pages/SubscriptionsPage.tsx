import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { BankConsentModal } from "@/components/bank/BankConsentModal";
import { BankReportModal } from "@/components/bank/BankReportModal";
import { guessDomain } from "@/lib/bank";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateSubscription,
  useDeleteSubscription,
  useSubscriptions,
  useUpdateSubscription,
} from "@/hooks/useSubscriptions";
import { useBankCallback, useBankConnectUrl, useDetectSubscriptions, useSyncTransactions } from "@/hooks/useBank";
import { getErrorMessage } from "@/api/axiosClient";
import type { DetectedSubscription, Subscription, SubscriptionInput } from "@/types";

export function SubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";

  const subscriptionsQuery = useSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();

  const bankConnectUrl = useBankConnectUrl();
  const bankCallback = useBankCallback();
  const syncTransactions = useSyncTransactions();
  const detectSubscriptions = useDetectSubscriptions();
  const createSubscription = useCreateSubscription();

  const [editing, setEditing] = React.useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | undefined>();
  const [consentOpen, setConsentOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [candidates, setCandidates] = React.useState<DetectedSubscription[]>([]);
  const [validating, setValidating] = React.useState(false);

  function handleDelete(subscription: Subscription) {
    if (!window.confirm(`Supprimer "${subscription.name}" ?`)) return;
    setDeletingId(subscription.id);
    deleteSubscription.mutate(subscription.id, { onSettled: () => setDeletingId(undefined) });
  }

  function handleUpdate(input: SubscriptionInput) {
    if (!editing) return;
    updateSubscription.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) });
  }

  /** Étape 1 : demande l'URL de la Webview Powens puis redirige la page entière dessus. */
  function handleConnectBank() {
    bankConnectUrl.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.webview_url;
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  /** Tunnel de détection : consentement (1) -> sync + algo (2) -> rapport + validation (3). */
  function handleOpenConsent() {
    setConsentOpen(true);
  }

  function handleConsent() {
    syncTransactions.mutate(undefined, {
      onError: (error) => {
        toast.error(getErrorMessage(error));
        setConsentOpen(false);
      },
      onSuccess: () => {
        detectSubscriptions.mutate(undefined, {
          onSuccess: (data) => {
            setCandidates(data);
            setConsentOpen(false);
            setReportOpen(true);
          },
          onError: (error) => {
            toast.error(getErrorMessage(error));
            setConsentOpen(false);
          },
        });
      },
    });
  }

  function handleExcludeCandidate(candidate: DetectedSubscription) {
    setCandidates((prev) => prev.filter((c) => c.merchant !== candidate.merchant));
  }

  /** Étape 3 : intègre définitivement tous les candidats restants du rapport. */
  async function handleValidateReport() {
    setValidating(true);
    let successCount = 0;
    for (const candidate of candidates) {
      const billingDay = new Date(candidate.next_estimated_date).getDate();
      const input: SubscriptionInput = {
        name: candidate.merchant,
        price: candidate.price,
        category: candidate.category,
        domain: guessDomain(candidate.merchant),
        billing_day: billingDay,
        importance: 2,
        start_date: candidate.last_date,
        trial_end_date: null,
      };
      try {
        await createSubscription.mutateAsync(input);
        successCount += 1;
      } catch (error) {
        toast.error(`"${candidate.merchant}" : ${getErrorMessage(error)}`);
      }
    }
    setValidating(false);
    setReportOpen(false);
    setCandidates([]);
    if (successCount > 0) {
      toast.success(`${successCount} abonnement(s) intégré(s) à ton tableau de bord.`);
    }
  }

  /** Étape 2 : au retour de la Webview Powens, l'URL contient state/connection_id/error en query params. */
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("state");
    if (!state) return;

    bankCallback.mutate(
      {
        state,
        connection_id: params.get("connection_id") ?? undefined,
        error: params.get("error") ?? undefined,
        error_description: params.get("error_description") ?? undefined,
      },
      {
        onSuccess: () => toast.success("Banque connectée avec succès."),
        onError: (error) => toast.error(getErrorMessage(error)),
        onSettled: () => navigate("/subscriptions", { replace: true }),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {subscriptionsQuery.data ? `${subscriptionsQuery.data.length} abonnement(s)` : "Gère tes abonnements"}
        </p>
        <div className="flex flex-wrap gap-2">
          {user?.bank_connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenConsent}
              loading={syncTransactions.isPending || detectSubscriptions.isPending}
            >
              <Sparkles className="h-4 w-4" /> Détecter mes abonnements
            </Button>
          )}
          <Button size="sm" onClick={() => navigate("/subscriptions/add")}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      <SubscriptionList
        subscriptions={subscriptionsQuery.data}
        isLoading={subscriptionsQuery.isPending}
        isError={subscriptionsQuery.isError}
        errorMessage={subscriptionsQuery.error ? getErrorMessage(subscriptionsQuery.error) : undefined}
        onRetry={() => subscriptionsQuery.refetch()}
        currency={currency}
        onEdit={setEditing}
        onDelete={handleDelete}
        onAdd={() => navigate("/subscriptions/add")}
        deletingId={deletingId}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'abonnement</DialogTitle>
            <DialogDescription>Mets à jour les informations puis enregistre.</DialogDescription>
          </DialogHeader>
          {editing && (
            <SubscriptionForm
              defaultValues={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              submitting={updateSubscription.isPending}
              errorMessage={updateSubscription.isError ? getErrorMessage(updateSubscription.error) : null}
            />
          )}
        </DialogContent>
      </Dialog>

      <BankConsentModal
        open={consentOpen}
        onOpenChange={setConsentOpen}
        onConsent={handleConsent}
        loading={syncTransactions.isPending || detectSubscriptions.isPending}
      />

      <BankReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        candidates={candidates}
        currency={currency}
        onExclude={handleExcludeCandidate}
        onValidate={handleValidateReport}
        validating={validating}
      />
    </div>
  );
}
