import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";
import { SubscriptionForm } from "@/components/subscriptions/SubscriptionForm";
import { BankConsentModal } from "@/components/bank/BankConsentModal";
import { BankScanPromptModal } from "@/components/bank/BankScanPromptModal";
import { BankReportModal, type CandidateReview } from "@/components/bank/BankReportModal";
import {
  loadTrackedMerchantKeys,
  normalizeMerchantKey,
  reconcileSubscriptions,
  saveTrackedMerchantKeys,
} from "@/lib/subscriptionReconciliation";
import { guessDomain } from "@/lib/bank";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCreateSubscription,
  useDeleteSubscription,
  useSubscriptions,
  useUpdateSubscription,
} from "@/hooks/useSubscriptions";
import { useBankConnectUrl } from "@/hooks/useBank";
import { useSubscriptionDetection } from "@/contexts/SubscriptionDetectionContext";
import { getErrorMessage } from "@/api/axiosClient";
import type { Subscription, SubscriptionInput } from "@/types";

export function SubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";

  const subscriptionsQuery = useSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();

  const bankConnectUrl = useBankConnectUrl();
  const createSubscription = useCreateSubscription();

  // Tunnel de détection (consentement -> sync -> algorithme -> rapport) isolé
  // dans son propre contexte, monté au-dessus des remounts de page -- cf.
  // contexts/SubscriptionDetectionContext.tsx pour le pourquoi.
  const {
    consentOpen,
    scanPromptOpen,
    reportOpen,
    candidates,
    isScanning,
    openConsent,
    setConsentOpen,
    setScanPromptOpen,
    handleScanPromptCta,
    runDetection,
    excludeCandidate,
    setReportOpen,
    clearCandidates,
  } = useSubscriptionDetection();

  const [editing, setEditing] = React.useState<Subscription | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | undefined>();
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

  /** Étape 3 : intègre les candidats revus dans la modale "Transactions importées".
   *
   * Deux chemins distincts :
   * 1. Candidats avec une cible de fusion (matched_subscription_id détecté
   *    côté serveur -- y compris un libellé bancaire hérité qu'une simple
   *    comparaison de texte ne peut pas repérer -- ou choisie manuellement) :
   *    mise à jour DIRECTE de cet abonnement précis, jamais de création.
   * 2. Le reste : réconciliation habituelle (Upsert & Cleanup) par Clé
   *    Marchand, comme avant. Le nom/catégorie édités par l'utilisateur dans
   *    la modale sont appliqués dans les deux cas.
   *
   * Les doublons hérités explicitement cochés par l'utilisateur sont
   * supprimés indépendamment de ces deux chemins. */
  async function handleValidateReport(reviews: CandidateReview[]) {
    setValidating(true);
    const existingSubs = subscriptionsQuery.data ?? [];

    let createdCount = 0;
    let updatedCount = 0;
    let removedCount = 0;

    const withMergeTarget = reviews.filter((r) => r.mergeTargetId);
    const withoutMergeTarget = reviews.filter((r) => !r.mergeTargetId);

    for (const review of withMergeTarget) {
      const existing = existingSubs.find((s) => s.id === review.mergeTargetId);
      const input: SubscriptionInput = {
        name: review.name,
        price: review.candidate.price,
        category: review.category,
        domain: existing?.domain ?? guessDomain(review.name),
        billing_day: new Date(review.candidate.next_estimated_date).getDate(),
        importance: existing?.importance ?? 2,
        start_date: review.candidate.last_date,
        trial_end_date: existing?.trial_end_date ?? null,
      };
      try {
        await updateSubscription.mutateAsync({ id: review.mergeTargetId as string, input });
        updatedCount += 1;
      } catch (error) {
        toast.error(`"${review.name}" : ${getErrorMessage(error)}`);
      }
    }

    for (const review of reviews) {
      for (const duplicateId of review.duplicatesToRemove) {
        try {
          await deleteSubscription.mutateAsync(duplicateId);
          removedCount += 1;
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
      }
    }

    const editedCandidates = withoutMergeTarget.map((r) => ({ ...r.candidate, merchant: r.name, category: r.category }));
    const { toCreate, toUpdate, toRemove, updatedTrackedMerchantKeys } = reconcileSubscriptions(
      existingSubs,
      editedCandidates,
      loadTrackedMerchantKeys()
    );

    for (const input of toCreate) {
      try {
        await createSubscription.mutateAsync(input);
        createdCount += 1;
      } catch (error) {
        toast.error(`"${input.name}" : ${getErrorMessage(error)}`);
        updatedTrackedMerchantKeys.delete(normalizeMerchantKey(input.name));
      }
    }

    for (const { id, input } of toUpdate) {
      try {
        await updateSubscription.mutateAsync({ id, input });
        updatedCount += 1;
      } catch (error) {
        toast.error(`"${input.name}" : ${getErrorMessage(error)}`);
      }
    }

    if (toRemove.length > 0) {
      const names = toRemove.map((s) => s.name).join(", ");
      const confirmed = window.confirm(
        `Ces abonnements ne sont retrouvés dans aucune transaction des 6 derniers mois (probablement résiliés) : ${names}. Les retirer de ton tableau de bord ?`
      );
      for (const subscription of toRemove) {
        if (!confirmed) {
          // L'utilisateur garde cet abonnement : il reste suivi pour la
          // prochaine réconciliation (sinon il ne serait plus jamais
          // proposé au nettoyage, ni ne pourrait être remis à jour).
          updatedTrackedMerchantKeys.add(normalizeMerchantKey(subscription.name));
          continue;
        }
        try {
          await deleteSubscription.mutateAsync(subscription.id);
          removedCount += 1;
        } catch (error) {
          toast.error(`"${subscription.name}" : ${getErrorMessage(error)}`);
          updatedTrackedMerchantKeys.add(normalizeMerchantKey(subscription.name));
        }
      }
    }

    saveTrackedMerchantKeys(updatedTrackedMerchantKeys);

    setValidating(false);
    setReportOpen(false);
    clearCandidates();

    const summary = [
      createdCount > 0 && `${createdCount} ajouté(s)`,
      updatedCount > 0 && `${updatedCount} mis à jour`,
      removedCount > 0 && `${removedCount} retiré(s)`,
    ].filter(Boolean);
    if (summary.length > 0) {
      toast.success(`Tableau de bord synchronisé : ${summary.join(", ")}.`);
    } else {
      toast.info("Aucun changement : ton tableau de bord était déjà à jour.");
    }
  }

  // Le retour de la Webview Powens (state/connection_id/error en query
  // params) est géré par SubscriptionDetectionProvider, monté au-dessus de
  // cette page -- cf. contexts/SubscriptionDetectionContext.tsx.

  return (
    <div className="w-full px-6 py-8">
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-luxury-text-light">
          {subscriptionsQuery.data ? `${subscriptionsQuery.data.length} abonnement(s)` : "Gère tes abonnements"}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/guide-abonnements")}
            title="Astuces et démarches pour gérer, réduire ou résilier vos abonnements"
          >
            <BookOpen className="h-4 w-4" /> Guide résiliation
          </Button>
          {user?.bank_connected && (
            <Button variant="outline" size="sm" onClick={openConsent} loading={isScanning}>
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

      <BankScanPromptModal open={scanPromptOpen} onOpenChange={setScanPromptOpen} onScan={handleScanPromptCta} />

      <BankConsentModal open={consentOpen} onOpenChange={setConsentOpen} onConsent={runDetection} loading={isScanning} />

      <BankReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        candidates={candidates}
        existingSubscriptions={subscriptionsQuery.data ?? []}
        currency={currency}
        onExclude={excludeCandidate}
        onValidate={handleValidateReport}
        validating={validating}
      />
    </div>
    </div>
  );
}
