import * as React from "react";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { useSharedSubscriptionGroup, useSubscriptionSplit, useSetSubscriptionSplit } from "@/hooks/useSharedSubscription";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/api/axiosClient";
import type { Currency, SplitMode } from "@/types";

const MODE_LABELS: Record<SplitMode, string> = {
  equal: "Également",
  percentage: "Pourcentage",
  fixed: "Montant fixe",
};

interface SubscriptionSplitModalProps {
  subscriptionId: string | null;
  currency: Currency;
  onOpenChange: (open: boolean) => void;
}

/** Configure comment UN abonnement partagé précis se répartit entre les
 * membres du groupe : qui y participe (sous-ensemble possible) et selon quel
 * mode (également / pourcentage / montant fixe). C'est la brique centrale
 * qui transforme le simple "diviseur 50/50" en vrai outil à la Tricount. */
export function SubscriptionSplitModal({ subscriptionId, currency, onOpenChange }: SubscriptionSplitModalProps) {
  const groupQuery = useSharedSubscriptionGroup();
  const splitQuery = useSubscriptionSplit(subscriptionId);
  const setSplit = useSetSubscriptionSplit();

  const [mode, setMode] = React.useState<SplitMode>("equal");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [values, setValues] = React.useState<Record<string, string>>({});

  // Initialise l'état local dès que la config actuelle est chargée -- ou à
  // chaque changement d'abonnement ciblé (la modale reste montée, seul
  // `subscriptionId` change côté parent).
  React.useEffect(() => {
    if (!splitQuery.data) return;
    setMode(splitQuery.data.split_mode);
    setSelectedIds(new Set(splitQuery.data.members.map((m) => m.member_id)));
    const nextValues: Record<string, string> = {};
    for (const m of splitQuery.data.members) {
      if (m.share_value != null) nextValues[m.member_id] = String(m.share_value);
    }
    setValues(nextValues);
  }, [splitQuery.data, subscriptionId]);

  const members = groupQuery.data?.members ?? [];
  const price = splitQuery.data?.price ?? 0;

  function toggleMember(memberId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  }

  const selectedCount = selectedIds.size;
  const sumValues = Array.from(selectedIds).reduce((sum, id) => sum + (Number(values[id]) || 0), 0);

  let validationMessage: string | null = null;
  let isValid = selectedCount > 0;

  if (selectedCount === 0) {
    validationMessage = "Sélectionne au moins un membre.";
  } else if (mode === "percentage" && Math.abs(sumValues - 100) > 0.5) {
    isValid = false;
    validationMessage = `${sumValues.toFixed(1)}% réparti — il manque ${(100 - sumValues).toFixed(1)}% pour atteindre 100%.`;
  } else if (mode === "fixed" && Math.abs(sumValues - price) > 0.5) {
    isValid = false;
    validationMessage = `${formatPrice(sumValues, currency)} réparti sur ${formatPrice(price, currency)} — il manque ${formatPrice(price - sumValues, currency)}.`;
  }

  function handleSave() {
    if (!subscriptionId || !isValid) return;
    setSplit.mutate(
      {
        subscriptionId,
        input: {
          split_mode: mode,
          members: Array.from(selectedIds).map((id) => ({
            member_id: id,
            share_value: mode === "equal" ? null : Number(values[id]) || 0,
          })),
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  const isLoading = groupQuery.isPending || splitQuery.isPending;

  return (
    <Dialog open={!!subscriptionId} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Répartir {splitQuery.data?.display_name ?? "cet abonnement"}</DialogTitle>
          <DialogDescription>
            {splitQuery.data && `${formatPrice(splitQuery.data.price, currency)} / mois — choisis qui participe et comment.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {/* Sélecteur de mode */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MODE_LABELS) as SplitMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                    mode === m
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-surface text-text-muted hover:bg-surface-hover"
                  )}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            {/* Checklist des membres */}
            <div className="space-y-2">
              {members.map((member) => {
                const selected = selectedIds.has(member.id);
                const equalShare = selectedCount > 0 ? price / selectedCount : 0;
                return (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                      selected ? "border-primary/40 bg-primary-light/30" : "border-border"
                    )}
                  >
                    <label className="flex flex-1 cursor-pointer items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                          selected ? "border-primary bg-primary text-white" : "border-border bg-surface"
                        )}
                      >
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <input type="checkbox" className="sr-only" checked={selected} onChange={() => toggleMember(member.id)} />
                      <span className="truncate text-sm font-medium text-text-main">{member.name}</span>
                    </label>

                    {selected && mode !== "equal" && (
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={values[member.id] ?? ""}
                        onChange={(e) => setValues((prev) => ({ ...prev, [member.id]: e.target.value }))}
                        className="w-24 text-right"
                        placeholder={mode === "percentage" ? "%" : formatPrice(0, currency)}
                      />
                    )}
                    {selected && mode === "equal" && (
                      <span className="shrink-0 text-sm text-text-muted">{formatPrice(equalShare, currency)}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {validationMessage && (
              <p className={cn("text-xs", isValid ? "text-emerald-600" : "text-amber-600")}>{validationMessage}</p>
            )}
            {!validationMessage && mode === "percentage" && (
              <p className="text-xs text-emerald-600">100% réparti ✓</p>
            )}
            {!validationMessage && mode === "fixed" && (
              <p className="text-xs text-emerald-600">Montant réparti en totalité ✓</p>
            )}

            {setSplit.isError && (
              <ErrorAlert message={getErrorMessage(setSplit.error, "Impossible d'enregistrer la répartition.")} compact />
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSave} loading={setSplit.isPending} disabled={!isValid || isLoading}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
