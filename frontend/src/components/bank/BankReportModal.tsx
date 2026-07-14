import * as React from "react";
import { Sparkles, X, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/format";
import { CATEGORIES } from "@/types";
import type { Currency, DetectedSubscription, Subscription } from "@/types";

const FREQUENCY_LABELS: Record<DetectedSubscription["frequency"], string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  yearly: "Annuel",
};

function candidateKey(c: DetectedSubscription): string {
  return `${c.merchant}-${c.frequency}-${c.price}`;
}

export interface CandidateReview {
  candidate: DetectedSubscription;
  /** Nom final (édité ou non) qui sera enregistré. */
  name: string;
  /** Catégorie finale (éditée ou non). */
  category: string;
  /** Si renseigné : ce candidat met à jour CET abonnement existant au lieu
   * d'en créer un nouveau (pré-rempli par matched_subscription_id, éditable
   * manuellement par l'utilisateur). */
  mergeTargetId: string | null;
  /** Doublons détectés que l'utilisateur a choisi de supprimer. */
  duplicatesToRemove: string[];
}

export interface BankReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: DetectedSubscription[];
  existingSubscriptions: Subscription[];
  currency: Currency;
  onExclude: (candidate: DetectedSubscription) => void;
  onValidate: (reviews: CandidateReview[]) => void;
  validating?: boolean;
}

interface RowState {
  name: string;
  category: string;
  mergeTargetId: string | null;
  duplicatesToRemove: Set<string>;
}

/** Étape "Transactions importées" du tunnel de détection bancaire : contrairement
 * à un simple rapport passif, chaque candidat peut être renommé, recatégorisé,
 * explicitement fusionné avec un abonnement existant (corrige les doublons du
 * type "Prixtel" détectés par le serveur via matched_subscription_id /
 * duplicate_subscription_ids -- une comparaison de texte brut côté client ne
 * peut pas repérer qu'un libellé bancaire hérité désigne le même marchand),
 * ou exclu avant intégration globale. */
export function BankReportModal({
  open,
  onOpenChange,
  candidates,
  existingSubscriptions,
  currency,
  onExclude,
  onValidate,
  validating,
}: BankReportModalProps) {
  const [rows, setRows] = React.useState<Record<string, RowState>>({});

  // Réinitialise l'état d'édition à chaque nouveau rapport (nouvelle liste de
  // candidats) -- préserve les valeurs déjà présentes si un candidat exclu
  // fait juste rétrécir la liste sans changer les autres.
  React.useEffect(() => {
    setRows((prev) => {
      const next: Record<string, RowState> = {};
      for (const c of candidates) {
        const key = candidateKey(c);
        next[key] = prev[key] ?? {
          name: c.merchant,
          category: c.category,
          mergeTargetId: c.matched_subscription_id,
          duplicatesToRemove: new Set(c.duplicate_subscription_ids),
        };
      }
      return next;
    });
  }, [candidates]);

  function updateRow(key: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function toggleDuplicate(key: string, subscriptionId: string) {
    setRows((prev) => {
      const current = prev[key];
      const nextSet = new Set(current.duplicatesToRemove);
      if (nextSet.has(subscriptionId)) nextSet.delete(subscriptionId);
      else nextSet.add(subscriptionId);
      return { ...prev, [key]: { ...current, duplicatesToRemove: nextSet } };
    });
  }

  function handleValidateClick() {
    const reviews: CandidateReview[] = candidates.map((c) => {
      const row = rows[candidateKey(c)];
      return {
        candidate: c,
        name: row?.name.trim() || c.merchant,
        category: row?.category || c.category,
        mergeTargetId: row?.mergeTargetId ?? null,
        duplicatesToRemove: row ? Array.from(row.duplicatesToRemove) : [],
      };
    });
    onValidate(reviews);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> Transactions importées
          </DialogTitle>
          <DialogDescription>
            {candidates.length > 0
              ? `${candidates.length} abonnement(s) récurrent(s) détecté(s). Vérifie, renomme ou fusionne avant d'intégrer.`
              : "Aucun abonnement récurrent détecté pour l'instant."}
          </DialogDescription>
        </DialogHeader>

        {candidates.length > 0 && (
          <ul className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto pr-1">
            {candidates.map((c) => {
              const key = candidateKey(c);
              const row = rows[key];
              if (!row) return null;
              const categoryOptions = Array.from(new Set([c.category, ...CATEGORIES]));
              const duplicates = c.duplicate_subscription_ids
                .map((id) => existingSubscriptions.find((s) => s.id === id))
                .filter((s): s is Subscription => !!s);

              return (
                <li key={key} className="rounded-xl border border-slate-900/10 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs text-luxury-text-light">Nom</Label>
                        <Input
                          value={row.name}
                          onChange={(e) => updateRow(key, { name: e.target.value })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-luxury-text-light">Catégorie</Label>
                        <Select
                          value={row.category}
                          onChange={(e) => updateRow(key, { category: e.target.value })}
                          className="h-9"
                        >
                          {categoryOptions.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <button
                      onClick={() => onExclude(c)}
                      aria-label={`Exclure ${c.merchant} de l'import`}
                      className="shrink-0 rounded-lg p-2 text-luxury-text-light transition-colors hover:bg-slate-100 hover:text-luxury-text"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-luxury-text-light">
                    <span>
                      {formatPrice(c.price, currency)} · {FREQUENCY_LABELS[c.frequency]} · {Math.round(c.confidence * 100)}% confiance
                    </span>
                    {c.confidence < 1 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                        Marchand inconnu - à vérifier
                      </span>
                    )}
                  </p>

                  <div className="mt-2">
                    <Label className="flex items-center gap-1 text-xs text-luxury-text-light">
                      <Link2 className="h-3 w-3" /> Fusionner avec un abonnement existant
                    </Label>
                    <Select
                      value={row.mergeTargetId ?? ""}
                      onChange={(e) => updateRow(key, { mergeTargetId: e.target.value || null })}
                      className="h-9"
                    >
                      <option value="">Aucun -- créer un nouvel abonnement</option>
                      {existingSubscriptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>

                  {duplicates.length > 0 && (
                    <div className="mt-2 rounded-lg bg-amber-50 p-2">
                      <p className="text-xs font-medium text-amber-800">Doublons détectés à nettoyer :</p>
                      {duplicates.map((dup) => (
                        <label key={dup.id} className="mt-1 flex cursor-pointer items-center gap-2 text-xs text-amber-800">
                          <input
                            type="checkbox"
                            checked={row.duplicatesToRemove.has(dup.id)}
                            onChange={() => toggleDuplicate(key, dup.id)}
                          />
                          Supprimer « {dup.name} »
                        </label>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
          {candidates.length > 0 && (
            <Button onClick={handleValidateClick} loading={validating}>
              Intégrer au tableau de bord
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
