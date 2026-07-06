import { useMemo } from "react";
import { Wallet, Trophy, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { CTALink } from "@/components/shared/CTALink";
import { formatPrice, daysUntil } from "@/lib/format";

/** Point d'entrée principal de l'app : vue condensée en 3 cartes Bento
 * (dépense totale, top abonnements, alerte essais gratuits). */
export function OverviewPage() {
  const { user } = useAuth();
  const subscriptionsQuery = useSubscriptions();
  const currency = user?.currency ?? "EUR";
  const subs = subscriptionsQuery.data ?? [];

  const monthlyTotal = useMemo(() => subs.reduce((sum, s) => sum + s.price, 0), [subs]);

  const topSubscriptions = useMemo(
    () => [...subs].sort((a, b) => b.price - a.price).slice(0, 3),
    [subs]
  );

  const endingTrials = useMemo(
    () =>
      subs.filter(
        (s) => s.trial_end_date && daysUntil(s.trial_end_date) >= 0 && daysUntil(s.trial_end_date) <= 14
      ),
    [subs]
  );

  return (
    <div className="w-full px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <RevealText as="h1" className="text-5xl font-black tracking-tight text-white sm:text-6xl">
          Vue d'ensemble
        </RevealText>
        <RevealText className="mt-4 max-w-xl text-lg text-zinc-400">
          Tout ce qu'il faut savoir sur tes abonnements, en un coup d'œil.
        </RevealText>

        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Total mensuel des dépenses</p>
              <p className="mt-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-5xl font-black text-transparent">
                {formatPrice(monthlyTotal, currency)}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-zinc-500">Tes 3 plus gros abonnements</p>
              {topSubscriptions.length === 0 && <p className="text-sm text-zinc-600">Aucun abonnement pour l'instant.</p>}
              <ul className="space-y-2">
                {topSubscriptions.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-white">{sub.name}</span>
                    <span className="shrink-0 font-semibold text-zinc-300">{formatPrice(sub.price, currency)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </BentoTile>

          <BentoTile className={`flex flex-col justify-between ${endingTrials.length > 0 ? "border-orange-500/30 bg-orange-500/[0.06]" : ""}`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-zinc-500">Essais gratuits qui se terminent</p>
              {endingTrials.length === 0 ? (
                <p className="text-sm text-zinc-600">Aucun essai en cours de fin.</p>
              ) : (
                <ul className="space-y-2">
                  {endingTrials.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-white">{sub.name}</span>
                      <span className="shrink-0 font-semibold text-orange-300">
                        {daysUntil(sub.trial_end_date!)} j restants
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </BentoTile>
        </div>

        <div className="mt-10 flex flex-wrap gap-6">
          <CTALink to="/subscriptions" variant="ghost">
            Voir tous mes abonnements
          </CTALink>
          <CTALink to="/dashboard" variant="ghost">
            Explorer le tableau de bord
          </CTALink>
        </div>
      </div>
    </div>
  );
}
