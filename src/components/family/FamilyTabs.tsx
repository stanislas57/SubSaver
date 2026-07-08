import * as React from "react";
import { UserPlus, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FamilyMemberRow } from "@/components/family/FamilyMemberRow";
import { FamilyBalanceCard } from "@/components/family/FamilyBalanceCard";
import { useAddFamilyMember, useFamilyBalances, useFamilyGroup, useRemoveFamilyMember } from "@/hooks/useFamily";
import type { Currency, FamilyMember } from "@/types";

export function FamilyTabs({ currency }: { currency: Currency }) {
  const groupQuery = useFamilyGroup();
  const balancesQuery = useFamilyBalances();
  const addMember = useAddFamilyMember();
  const removeMember = useRemoveFamilyMember();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addMember.mutate(
      { name: name.trim(), email: email.trim() || undefined },
      { onSuccess: () => { setName(""); setEmail(""); } }
    );
  }

  function handleRemove(member: FamilyMember) {
    setRemovingId(member.id);
    removeMember.mutate(member.id, { onSettled: () => setRemovingId(null) });
  }

  return (
    <Tabs defaultValue="members">
      <TabsList>
        <TabsTrigger value="members">Membres</TabsTrigger>
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
          <ErrorAlert message="Impossible de charger le groupe familial." onRetry={() => groupQuery.refetch()} />
        )}
        {groupQuery.data && (
          <>
            {groupQuery.data.members.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title="Aucun membre" description="Ajoute un premier membre à ton groupe familial." />
            ) : (
              <div className="mb-4">
                {groupQuery.data.members.map((m) => (
                  <FamilyMemberRow key={m.id} member={m} onRemove={handleRemove} removing={removingId === m.id} />
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
              <FamilyBalanceCard key={b.member_id} balance={b} currency={currency} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
