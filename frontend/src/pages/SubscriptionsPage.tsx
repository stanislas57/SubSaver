import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Download, Landmark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { DetectedSubscriptionsDialog, guessDomain } from "@/components/bank/DetectedSubscriptionsDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateSubscription,
  useDeleteSubscription,
  useExportSubscriptionsCsv,
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
  const exportCsv = useExportSubscriptionsCsv();

  const bankConnectUrl = useBankConnectUrl();
  const bankCallback = useBankCallback();
  const syncTransactions = useSyncTransactions();
  const detectSubscriptions = useDetectSubscriptions();
  const createSubscription = useCreateSubscription();

  const [editing, setEditing] = React.useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | undefined>();
  const [detectDialogOpen, setDetectDialogOpen] = React.useState(false);
  const [candidates, setCandidates] = React.useState<DetectedSubscription[]>([]);
  const [acceptingMerchant, setAcceptingMerchant] = React.useState<string | undefined>();

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

  /** Enchaîne sync des transactions puis lancement de l'algo de détection (F3 -> F4). */
  function handleDetectSubscriptions() {
    syncTransactions.mutate(undefined, {
      onError: (error) => toast.error(getErrorMessage(error)),
      onSuccess: () => {
        detectSubscriptions.mutate(undefined, {
          onSuccess: (data) => {
            setCandidates(data);
            setDetectDialogOpen(true);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        });
      },
    });
  }

  function handleAcceptCandidate(candidate: DetectedSubscription) {
    setAcceptingMerchant(candidate.merchant);
    const billingDay = new Date(candidate.next_estimated_date).getDate();
    const input: SubscriptionInput = {
      name: candidate.merchant,
      price: candidate.price,
      category: "Autre",
      domain: guessDomain(candidate.merchant),
      billing_day: billingDay,
      importance: 2,
      start_date: candidate.last_date,
      trial_end_date: null,
    };
    createSubscription.mutate(input, {
      onSuccess: () => {
        toast.success(`"${candidate.merchant}" ajouté à tes abonnements.`);
        setCandidates((prev) => prev.filter((c) => c.merchant !== candidate.merchant));
      },
      onError: (error) => toast.error(getErrorMessage(error)),
      onSettled: () => setAcceptingMerchant(undefined),
    });
  }

  function handleRejectCandidate(candidate: DetectedSubscription) {
    setCandidates((prev) => prev.filter((c) => c.merchant !== candidate.merchant));
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
          <Button variant="outline" size="sm" onClick={handleConnectBank} loading={bankConnectUrl.isPending}>
            <Landmark className="h-4 w-4" /> Connecter ma banque
          </Button>
          {user?.bank_connected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDetectSubscriptions}
              loading={syncTransactions.isPending || detectSubscriptions.isPending}
            >
              <Sparkles className="h-4 w-4" /> Détecter mes abonnements
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv.mutate()}
            loading={exportCsv.isPending}
            disabled={!subscriptionsQuery.data?.length}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
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

      <DetectedSubscriptionsDialog
        open={detectDialogOpen}
        onOpenChange={setDetectDialogOpen}
        candidates={candidates}
        onAccept={handleAcceptCandidate}
        onReject={handleRejectCandidate}
        acceptingMerchant={acceptingMerchant}
      />
    </div>
  );
}
