import * as React from "react";
import { ArrowRight, PartyPopper, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useDebts, useSettleDebt, useSettlements } from "@/hooks/useSharedSubscription";
import { formatPrice, formatDateTime } from "@/lib/format";
import { getErrorMessage } from "@/api/axiosClient";
import type { Currency, DebtEdge } from "@/types";

/** Onglet "Dettes" : qui doit combien à qui, déjà simplifié côté serveur
 * (nombre minimal de transactions), avec bouton "Marquer comme remboursé" et
 * historique des règlements passés -- la brique centrale qui transforme le
 * simple diviseur de coût en vrai outil à la Tricount. */
export function SharedSubscriptionDebts({ currency }: { currency: Currency }) {
  const debtsQuery = useDebts();
  const settlementsQuery = useSettlements();
  const settleDebt = useSettleDebt();
  const [debtToSettle, setDebtToSettle] = React.useState<DebtEdge | null>(null);
  const [amount, setAmount] = React.useState("");

  function openSettleDialog(debt: DebtEdge) {
    setDebtToSettle(debt);
    setAmount(String(debt.amount));
  }

  function confirmSettle() {
    if (!debtToSettle) return;
    const parsedAmount = Number(amount);
    if (!(parsedAmount > 0)) return;
    settleDebt.mutate(
      { from_member_id: debtToSettle.from_member_id, to_member_id: debtToSettle.to_member_id, amount: parsedAmount },
      { onSuccess: () => setDebtToSettle(null) }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        {debtsQuery.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {debtsQuery.isError && (
          <ErrorAlert message="Impossible de charger les dettes." onRetry={() => debtsQuery.refetch()} />
        )}
        {debtsQuery.data && debtsQuery.data.length === 0 && (
          <EmptyState
            icon={<PartyPopper className="h-6 w-6" />}
            title="Tout est réglé !"
            description="Aucune dette en cours ce mois-ci -- tout le monde est à jour."
          />
        )}
        {debtsQuery.data && debtsQuery.data.length > 0 && (
          <div className="space-y-2">
            {debtsQuery.data.map((debt) => (
              <div
                key={`${debt.from_member_id}-${debt.to_member_id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <span className="font-medium text-text-main">{debt.from_member_name}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
                  <span className="font-medium text-text-main">{debt.to_member_name}</span>
                  <span className="ml-1 shrink-0 font-display font-bold text-text-main">
                    {formatPrice(debt.amount, currency)}
                  </span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => openSettleDialog(debt)}>
                  Marquer comme remboursé
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text-main">
          <History className="h-4 w-4" />
          Historique des règlements
        </div>
        {settlementsQuery.isPending && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {settlementsQuery.isError && (
          <ErrorAlert message="Impossible de charger l'historique." onRetry={() => settlementsQuery.refetch()} />
        )}
        {settlementsQuery.data && settlementsQuery.data.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">Aucun règlement enregistré pour l'instant.</p>
        )}
        {settlementsQuery.data && settlementsQuery.data.length > 0 && (
          <div className="space-y-1.5">
            {settlementsQuery.data.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface px-3 py-2 text-xs">
                <span className="text-text-muted">
                  {formatDateTime(s.created_at)} — <span className="font-medium text-text-main">{s.from_member_name}</span> a
                  remboursé <span className="font-medium text-text-main">{s.to_member_name}</span>
                </span>
                <span className="font-semibold text-text-main">{formatPrice(s.amount, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!debtToSettle} onOpenChange={(open) => !open && setDebtToSettle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme remboursé</DialogTitle>
            <DialogDescription>
              {debtToSettle && `${debtToSettle.from_member_name} rembourse ${debtToSettle.to_member_name}.`}
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="settle-amount">Montant</Label>
            <Input
              id="settle-amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="mt-1 text-xs text-text-muted">
              Modifiable pour un remboursement partiel -- par défaut, le montant total de la dette.
            </p>
          </div>

          {settleDebt.isError && (
            <ErrorAlert message={getErrorMessage(settleDebt.error, "Impossible d'enregistrer le règlement.")} compact />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDebtToSettle(null)}>
              Annuler
            </Button>
            <Button type="button" onClick={confirmSettle} loading={settleDebt.isPending} disabled={!(Number(amount) > 0)}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
