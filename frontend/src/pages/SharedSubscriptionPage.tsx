import * as React from "react";
import { Users, Minus, Plus, PiggyBank, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShareableSubscriptions, useSharedSubscriptionGroup } from "@/hooks/useSharedSubscription";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { SharedSubscriptionTabs } from "@/components/shared-subscription/SharedSubscriptionTabs";
import { formatPrice } from "@/lib/format";

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 6;

/** Espace Particulier Premium : au-dessus de la gestion réelle du groupe
 * (SharedSubscriptionTabs), affiche soit un résumé RÉEL (dès qu'un vrai
 * membre a été ajouté), soit un simulateur explicitement labellisé comme
 * hypothétique (tant que l'utilisateur est seul dans son groupe) -- les deux
 * ne coexistent jamais, pour ne plus jamais laisser croire qu'ajuster le
 * curseur "personnes" change la vraie répartition affichée plus bas.
 *
 * Règle métier (inchangée) : le calcul se base UNIQUEMENT sur les
 * abonnements explicitement cochés comme partagés (onglet "Abonnements
 * partagés" ci-dessous), jamais sur le total de tous les abonnements. */
export function SharedSubscriptionPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const shareableQuery = useShareableSubscriptions();
  const groupQuery = useSharedSubscriptionGroup();
  const [hypotheticalMembers, setHypotheticalMembers] = React.useState(2);

  const sharedTotal = (shareableQuery.data ?? [])
    .filter((s) => s.is_shared)
    .reduce((sum, s) => sum + s.price, 0);

  // Le propriétaire est toujours membre implicite (cf. backend) : "un vrai
  // groupe" signifie donc au moins 1 membre EN PLUS du propriétaire.
  const realMemberCount = groupQuery.data?.members.length ?? 1;
  const hasRealGroup = realMemberCount > 1;

  const perPerson = sharedTotal / hypotheticalMembers;
  const savingsPerPerson = sharedTotal - perPerson;
  const yearlySavingsPerPerson = savingsPerPerson * 12;

  return (
    <div className="w-full px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
          <Users className="h-6 w-6" />
        </div>
        <RevealText as="h1" className="text-4xl font-black tracking-tight text-luxury-text sm:text-5xl">
          Abonnement partagé
        </RevealText>
        <RevealText className="mt-3 max-w-xl text-lg text-luxury-text-light">
          Divise le coût de tes abonnements avec tes proches et suis qui doit quoi à qui, sans prise de tête.
        </RevealText>

        {hasRealGroup ? (
          /* Résumé réel : dès qu'un vrai membre existe, on arrête de montrer
           * un simulateur déconnecté et on affiche l'état réel du groupe. */
          <BentoTile className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-luxury-text-light">Ton groupe</p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  {sharedTotal > 0
                    ? `Réparti entre ${realMemberCount} membres réels -- détail dans l'onglet « Répartition » ci-dessous.`
                    : "Sélectionne des abonnements à partager dans l'onglet ci-dessous."}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-luxury-bg-soft px-5 py-3">
                <Wallet className="h-5 w-5 text-luxury-gold-deep" />
                <div>
                  <p className="text-xs text-luxury-text-light">Total partagé / mois</p>
                  <p className="text-2xl font-black text-luxury-text">{formatPrice(sharedTotal, currency)}</p>
                </div>
              </div>
            </div>
          </BentoTile>
        ) : (
          /* Simulation hypothétique, explicitement labellisée comme telle
           * tant qu'aucun vrai membre n'a été ajouté au groupe. */
          <BentoTile className="mt-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-luxury-text-light">Simulation hypothétique</p>
                <p className="mt-1 text-sm text-luxury-text-light">
                  {sharedTotal > 0
                    ? `Tu n'as pas encore ajouté de vrais membres -- ceci reste une simulation, pas ta répartition réelle. Base : ${formatPrice(sharedTotal, currency)}.`
                    : "Sélectionne des abonnements à partager dans l'onglet ci-dessous pour voir la simulation."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHypotheticalMembers((m) => Math.max(MIN_MEMBERS, m - 1))}
                  disabled={hypotheticalMembers <= MIN_MEMBERS}
                  aria-label="Retirer une personne"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 bg-white text-luxury-text shadow-sm transition-colors hover:bg-luxury-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <p className="text-3xl font-black text-luxury-text">{hypotheticalMembers}</p>
                  <p className="text-xs text-luxury-text-light">personnes (hypothétique)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHypotheticalMembers((m) => Math.min(MAX_MEMBERS, m + 1))}
                  disabled={hypotheticalMembers >= MAX_MEMBERS}
                  aria-label="Ajouter une personne"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 bg-white text-luxury-text shadow-sm transition-colors hover:bg-luxury-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-luxury-bg-soft p-5">
                <p className="text-sm font-medium text-luxury-text-light">Coût par personne / mois (simulé)</p>
                <p className="mt-1 text-3xl font-black text-luxury-text">{formatPrice(perPerson, currency)}</p>
              </div>
              <div className="rounded-2xl bg-luxury-night p-5">
                <div className="flex items-center gap-2 text-luxury-gold">
                  <PiggyBank className="h-4 w-4" />
                  <p className="text-sm font-medium">Économie par personne / an (simulée)</p>
                </div>
                <p className="mt-1 text-3xl font-black text-white">{formatPrice(yearlySavingsPerPerson, currency)}</p>
              </div>
            </div>
          </BentoTile>
        )}

        {/* Gestion réelle du groupe */}
        <BentoTile className="mt-6">
          <SharedSubscriptionTabs currency={currency} />
        </BentoTile>
      </div>
    </div>
  );
}
