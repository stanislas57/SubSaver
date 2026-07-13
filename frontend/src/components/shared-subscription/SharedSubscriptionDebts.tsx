import * as React from "react";
import { toast } from "sonner";
import { ArrowRight, PartyPopper, History, Bell, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/alert";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  useDebts,
  useSendDebtReminder,
  useSettleDebt,
  useSettlements,
  useSharedSubscriptionGroup,
} from "@/hooks/useSharedSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, formatDateTime } from "@/lib/format";
import { getErrorMessage } from "@/api/axiosClient";
import type { Currency, DebtEdge } from "@/types";

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const REMINDER_COOLDOWN_STORAGE_KEY = "subsaver:debt-reminder-cooldowns";

function reminderCooldownKey(debt: DebtEdge): string {
  return `${debt.from_member_id}-${debt.to_member_id}`;
}

/** Anti-spam client (UX seulement -- la vraie protection est le rate
 * limiting 10/heure côté serveur, cf. POST /family/debts/remind) : une fois
 * une relance envoyée pour une paire débiteur/créditeur, le bouton reste
 * désactivé 24h pour éviter les clics répétés sur la même échéance. */
function readReminderCooldowns(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_COOLDOWN_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function markReminderSent(debt: DebtEdge) {
  const cooldowns = readReminderCooldowns();
  cooldowns[reminderCooldownKey(debt)] = Date.now();
  localStorage.setItem(REMINDER_COOLDOWN_STORAGE_KEY, JSON.stringify(cooldowns));
}

function isReminderOnCooldown(debt: DebtEdge, cooldowns: Record<string, number>): boolean {
  const sentAt = cooldowns[reminderCooldownKey(debt)];
  return !!sentAt && Date.now() - sentAt < REMINDER_COOLDOWN_MS;
}

const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function currentPeriodLabel(): string {
  const now = new Date();
  return `${FRENCH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function todayLabel(): string {
  const now = new Date();
  return `${now.getDate()} ${FRENCH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

/** Onglet "Dettes" : qui doit combien à qui, déjà simplifié côté serveur
 * (nombre minimal de transactions), avec bouton "Marquer comme remboursé",
 * bouton "Envoyer la notification" (relance envoyée depuis le serveur SubSaver,
 * cf. POST /family/debts/remind) et historique des règlements passés -- la
 * brique centrale qui transforme le simple diviseur de coût en vrai outil à
 * la Tricount. */
export function SharedSubscriptionDebts({ currency }: { currency: Currency }) {
  const { user } = useAuth();
  const debtsQuery = useDebts();
  const settlementsQuery = useSettlements();
  const groupQuery = useSharedSubscriptionGroup();
  const settleDebt = useSettleDebt();
  const sendReminder = useSendDebtReminder();
  const [debtToSettle, setDebtToSettle] = React.useState<DebtEdge | null>(null);
  const [amount, setAmount] = React.useState("");
  const [debtToRemind, setDebtToRemind] = React.useState<DebtEdge | null>(null);
  const [cooldowns, setCooldowns] = React.useState(readReminderCooldowns);

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

  function closeReminderDialog() {
    setDebtToRemind(null);
  }

  /** Envoi serveur (POST /family/debts/remind, cf. app/api/v1/family.py) --
   * l'e-mail part de SubSaver, pas de l'adresse personnelle de
   * l'utilisateur. Rate limiting réel (10/heure) côté backend ; le cooldown
   * client de 24h ci-dessous n'est qu'une protection UX complémentaire pour
   * éviter les clics répétés sur la même échéance. */
  function confirmReminder() {
    if (!debtToRemind) return;
    sendReminder.mutate(
      { member_id: debtToRemind.from_member_id, amount: debtToRemind.amount },
      {
        onSuccess: () => {
          toast.success(`Relance envoyée à ${debtToRemind.from_member_name}.`);
          markReminderSent(debtToRemind);
          setCooldowns(readReminderCooldowns());
          closeReminderDialog();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Impossible d'envoyer la relance.")),
      }
    );
  }

  const debtorEmail = debtToRemind
    ? groupQuery.data?.members.find((m) => m.id === debtToRemind.from_member_id)?.email
    : null;

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
            {debtsQuery.data.map((debt) => {
              const hasEmail = !!groupQuery.data?.members.find((m) => m.id === debt.from_member_id)?.email;
              const onCooldown = isReminderOnCooldown(debt, cooldowns);
              return (
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
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={
                        !hasEmail
                          ? "Aucune adresse e-mail enregistrée pour ce membre"
                          : onCooldown
                            ? "Relance déjà envoyée récemment -- réessaie dans moins de 24h"
                            : `Envoyer la notification par e-mail à ${debt.from_member_name}`
                      }
                      disabled={!hasEmail || onCooldown}
                      onClick={() => setDebtToRemind(debt)}
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => openSettleDialog(debt)}>
                      Marquer comme remboursé
                    </Button>
                  </div>
                </div>
              );
            })}
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

      <Dialog open={!!debtToRemind} onOpenChange={(open) => !open && closeReminderDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer la notification</DialogTitle>
            <DialogDescription>
              {debtToRemind &&
                `Envoie un e-mail depuis SubSaver à destination de ${debtToRemind.from_member_name}${debtorEmail ? ` (${debtorEmail})` : ""}.`}
            </DialogDescription>
          </DialogHeader>

          {debtToRemind && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-3 text-sm">
                <div>
                  <p className="text-xs text-text-muted">Membre</p>
                  <p className="font-medium text-text-main">{debtToRemind.from_member_name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Montant</p>
                  <p className="font-display font-bold text-text-main">{formatPrice(debtToRemind.amount, currency)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-text-muted">Raison</p>
                  <p className="font-medium text-text-main">Abonnements partagés — {currentPeriodLabel()}</p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-text-muted">Aperçu du message</p>
                <div className="rounded-lg border border-border p-3 text-sm text-text-main">
                  <p>Bonjour {debtToRemind.from_member_name},</p>
                  <p className="mt-2">
                    {user?.first_name ?? "Le gestionnaire"} te rappelle ta part sur les abonnements partagés SubSaver.
                  </p>
                  <p className="mt-2">
                    Montant dû : <strong>{formatPrice(debtToRemind.amount, currency)}</strong>
                    <br />
                    Raison : Abonnements partagés — {currentPeriodLabel()}
                    <br />
                    Date de la demande : {todayLabel()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {sendReminder.isError && (
            <ErrorAlert message={getErrorMessage(sendReminder.error, "Impossible d'envoyer la relance.")} compact />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeReminderDialog}>
              Annuler
            </Button>
            <Button type="button" onClick={confirmReminder} loading={sendReminder.isPending}>
              <Mail className="h-4 w-4" /> Envoyer la notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
