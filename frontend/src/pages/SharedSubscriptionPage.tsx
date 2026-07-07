import * as React from "react";
import { Users, Minus, Plus, PiggyBank } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShareableSubscriptions } from "@/hooks/useSharedSubscription";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { SharedSubscriptionTabs } from "@/components/shared-subscription/SharedSubscriptionTabs";
import { formatPrice } from "@/lib/format";

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 6;

/** Espace Particulier Premium : simulation des économies réalisées en
 * partageant ses abonnements, puis gestion réelle du groupe (membres,
 * répartition des coûts) via SharedSubscriptionTabs.
 *
 * Règle métier : la simulation se base UNIQUEMENT sur les abonnements que
 * l'utilisateur a explicitement cochés comme partagés (onglet "Abonnements
 * partagés" ci-dessous), jamais sur le total de tous ses abonnements --
 * partager Netflix ne doit pas mettre l'électricité dans le calcul. */
export function SharedSubscriptionPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "EUR";
  const shareableQuery = useShareableSubscriptions();
  const [members, setMembers] = React.useState(2);

  const sharedTotal = (shareableQuery.data ?? [])
    .filter((s) => s.is_shared)
    .reduce((sum, s) => sum + s.price, 0);
  const perPerson = sharedTotal / members;
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

        {/* Simulation des économies */}
        <BentoTile className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-luxury-text-light">Simule tes économies</p>
              <p className="mt-1 text-sm text-luxury-text-light">
                {sharedTotal > 0
                  ? `Sur la base de tes abonnements partagés : ${formatPrice(sharedTotal, currency)}`
                  : "Sélectionne des abonnements à partager dans l'onglet ci-dessous pour voir la simulation."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMembers((m) => Math.max(MIN_MEMBERS, m - 1))}
                disabled={members <= MIN_MEMBERS}
                aria-label="Retirer une personne"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 bg-white text-luxury-text shadow-sm transition-colors hover:bg-luxury-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-3xl font-black text-luxury-text">{members}</p>
                <p className="text-xs text-luxury-text-light">personnes</p>
              </div>
              <button
                type="button"
                onClick={() => setMembers((m) => Math.min(MAX_MEMBERS, m + 1))}
                disabled={members >= MAX_MEMBERS}
                aria-label="Ajouter une personne"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 bg-white text-luxury-text shadow-sm transition-colors hover:bg-luxury-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-luxury-bg-soft p-5">
              <p className="text-sm font-medium text-luxury-text-light">Coût par personne / mois</p>
              <p className="mt-1 text-3xl font-black text-luxury-text">{formatPrice(perPerson, currency)}</p>
            </div>
            <div className="rounded-2xl bg-luxury-night p-5">
              <div className="flex items-center gap-2 text-luxury-gold">
                <PiggyBank className="h-4 w-4" />
                <p className="text-sm font-medium">Économie par personne / an</p>
              </div>
              <p className="mt-1 text-3xl font-black text-white">{formatPrice(yearlySavingsPerPerson, currency)}</p>
            </div>
          </div>
        </BentoTile>

        {/* Gestion réelle du groupe */}
        <BentoTile className="mt-6">
          <SharedSubscriptionTabs currency={currency} />
        </BentoTile>
      </div>
    </div>
  );
}
