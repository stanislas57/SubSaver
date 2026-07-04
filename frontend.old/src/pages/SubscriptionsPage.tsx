import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { BankGrid } from "@/components/bank/BankGrid";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDeleteSubscription,
  useExportSubscriptionsCsv,
  useSubscriptions,
  useUpdateSubscription,
} from "@/hooks/useSubscriptions";
import { useBankProviders, useBankSync } from "@/hooks/useBank";
import { getErrorMessage } from "@/api/axiosClient";
import type { BankProvider, Subscription, SubscriptionInput } from "@/types";

export function SubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";

  const subscriptionsQuery = useSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();
  const exportCsv = useExportSubscriptionsCsv();

  const bankProvidersQuery = useBankProviders();
  const bankSync = useBankSync();

  const [editing, setEditing] = React.useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | undefined>();
  const [bankDialogOpen, setBankDialogOpen] = React.useState(false);
  const [syncingProviderId, setSyncingProviderId] = React.useState<string | undefined>();

  function handleDelete(subscription: Subscription) {
    if (!window.confirm(`Supprimer "${subscription.name}" ?`)) return;
    setDeletingId(subscription.id);
    deleteSubscription.mutate(subscription.id, { onSettled: () => setDeletingId(undefined) });
  }

  function handleUpdate(input: SubscriptionInput) {
    if (!editing) return;
    updateSubscription.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) });
  }

  function handleBankSelect(provider: BankProvider) {
    setSyncingProviderId(provider.id);
    bankSync.mutate(provider.id, {
      onSettled: () => setSyncingProviderId(undefined),
      onSuccess: () => setBankDialogOpen(false),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">
          {subscriptionsQuery.data ? `${subscriptionsQuery.data.length} abonnement(s)` : "Gère tes abonnements"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setBankDialogOpen(true)}>
            <Landmark className="h-4 w-4" /> Connecter ma banque
          </Button>
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

      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connecter ma banque</DialogTitle>
            <DialogDescription>Choisis ta banque pour détecter automatiquement tes abonnements.</DialogDescription>
          </DialogHeader>
          <BankGrid
            providers={bankProvidersQuery.data}
            isLoading={bankProvidersQuery.isPending}
            isError={bankProvidersQuery.isError}
            errorMessage={bankProvidersQuery.error ? getErrorMessage(bankProvidersQuery.error) : undefined}
            onRetry={() => bankProvidersQuery.refetch()}
            onSelect={handleBankSelect}
            syncingProviderId={syncingProviderId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
