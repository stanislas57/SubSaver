import * as React from "react";
import { UserPlus, Users, Wallet, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SharedSubscriptionMemberRow } from "@/components/shared-subscription/SharedSubscriptionMemberRow";
import { SharedSubscriptionBalanceCard } from "@/components/shared-subscription/SharedSubscriptionBalanceCard";
import {
  useAddSharedSubscriptionMember,
  useSetSharedSubscriptions,
  useShareableSubscriptions,
  useSharedSubscriptionBalances,
  useSharedSubscriptionGroup,
  useRemoveSharedSubscriptionMember,
} from "@/hooks/useSharedSubscription";
import { formatPrice } from "@/lib/format";
import type { Currency, ShareableSubscription, SharedSubscriptionMember } from "@/types";

/** Déduplique par email (les doublons "owner" partagent le même email --
 * celui de l'utilisateur -- avec des id différents) et, à défaut, par id.
 * Le backend nettoie déjà les doublons de son côté (cf. family.py) ; cette
 * couche défensive côté état React garantit qu'aucun doublon résiduel ne
 * s'affiche même si l'API renvoyait un jour une liste non nettoyée. */
function dedupeMembers(members: SharedSubscriptionMember[]): SharedSubscriptionMember[] {
  const seen = new Set<string>();
  const result: SharedSubscriptionMember[] = [];
  for (const member of members) {
    const key = member.email ?? member.id;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(member);
  }
  return result;
}

export function SharedSubscriptionTabs({ currency }: { currency: Currency }) {
  const groupQuery = useSharedSubscriptionGroup();
  const balancesQuery = useSharedSubscriptionBalances();
  const shareableQuery = useShareableSubscriptions();
  const addMember = useAddSharedSubscriptionMember();
  const removeMember = useRemoveSharedSubscriptionMember();
  const setSharedSubscriptions = useSetSharedSubscriptions();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const members = groupQuery.data ? dedupeMembers(groupQuery.data.members) : [];

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addMember.mutate(
      { name: name.trim(), email: email.trim() || undefined },
      { onSuccess: () => { setName(""); setEmail(""); } }
    );
  }

  function handleRemove(member: SharedSubscriptionMember) {
    setRemovingId(member.id);
    removeMember.mutate(member.id, { onSettled: () => setRemovingId(null) });
  }

  /** Règle métier : le partage porte uniquement sur les abonnements cochés,
   * jamais sur le total global. Recalcule la sélection complète (le
   * endpoint remplace toute la liste) à partir de l'état actuel + du
   * togglé. */
  function handleToggleShared(subscription: ShareableSubscription) {
    if (!shareableQuery.data) return;
    setTogglingId(subscription.id);
    const nextIds = shareableQuery.data
      .filter((s) => (s.id === subscription.id ? !subscription.is_shared : s.is_shared))
      .map((s) => s.id);
    setSharedSubscriptions.mutate(nextIds, { onSettled: () => setTogglingId(null) });
  }

  const sharedTotal = (shareableQuery.data ?? [])
    .filter((s) => s.is_shared)
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <Tabs defaultValue="members">
      <TabsList>
        <TabsTrigger value="members">Membres</TabsTrigger>
        <TabsTrigger value="subscriptions">Abonnements partagés</TabsTrigger>
        <TabsTrigger value="balances">Répartition</TabsTrigger>
      </TabsList>

      <TabsContent value="members">
        {groupQuery.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {groupQuery.isError && (
          <ErrorAlert message="Impossible de charger l'abonnement partagé." onRetry={() => groupQuery.refetch()} />
        )}
        {groupQuery.data && (
          <>
            {members.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title="Aucun membre" description="Ajoute un premier membre à ton abonnement partagé." />
            ) : (
              <div className="mb-4">
                {members.map((m) => (
                  <SharedSubscriptionMemberRow key={m.id} member={m} onRemove={handleRemove} removing={removingId === m.id} />
                ))}
              </div>
            )}
            <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
              <Input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" loading={addMember.isPending} disabled={!name.trim()}>
                <UserPlus className="h-4 w-4" /> Ajouter
              </Button>
            </form>
          </>
        )}
      </TabsContent>

      <TabsContent value="subscriptions">
        <p className="mb-3 text-sm text-text-muted">
          Choisis précisément quels abonnements entrent dans le partage -- la répartition ne porte que sur ceux-ci,
          jamais sur l'ensemble de tes abonnements.
        </p>
        {shareableQuery.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {shareableQuery.isError && (
          <ErrorAlert message="Impossible de charger tes abonnements." onRetry={() => shareableQuery.refetch()} />
        )}
        {shareableQuery.data && shareableQuery.data.length === 0 && (
          <EmptyState icon={<Wallet className="h-6 w-6" />} title="Aucun abonnement" description="Ajoute d'abord un abonnement pour pouvoir le partager." />
        )}
        {shareableQuery.data && shareableQuery.data.length > 0 && (
          <>
            <div className="space-y-2">
              {shareableQuery.data.map((subscription) => (
                <label
                  key={subscription.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        subscription.is_shared ? "border-primary bg-primary text-white" : "border-border bg-surface"
                      }`}
                    >
                      {subscription.is_shared && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={subscription.is_shared}
                      disabled={togglingId === subscription.id}
                      onChange={() => handleToggleShared(subscription)}
                    />
                    <span className="text-sm font-medium text-text-main">{subscription.name}</span>
                  </div>
                  <span className="text-sm text-text-muted">{formatPrice(subscription.price, currency)}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 border-t border-border pt-3 text-sm font-medium text-text-main">
              Total partagé : {formatPrice(sharedTotal, currency)}
            </p>
          </>
        )}
      </TabsContent>

      <TabsContent value="balances">
        {balancesQuery.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {balancesQuery.isError && (
          <ErrorAlert message="Impossible de charger la répartition." onRetry={() => balancesQuery.refetch()} />
        )}
        {balancesQuery.data && balancesQuery.data.length === 0 && (
          <p className="py-6 text-center text-sm text-text-muted">Pas encore de répartition à afficher.</p>
        )}
        {balancesQuery.data && balancesQuery.data.length > 0 && (
          <div className="space-y-2">
            {balancesQuery.data.map((b) => (
              <SharedSubscriptionBalanceCard key={b.member_id} balance={b} currency={currency} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
