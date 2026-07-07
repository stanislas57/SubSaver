import { memo, useMemo } from "react";
import { Wallet, ListChecks, AlertTriangle, Crown, Landmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { CTALink } from "@/components/shared/CTALink";
import { formatPrice, daysUntil } from "@/lib/format";
import type { Currency } from "@/types";

/** memo : props purement primitives — évite de re-rendre les cartes (et de
 * réinitialiser leur parallaxe GSAP) à chaque mise à jour du parent. */
const SubscriptionParallaxCard = memo(function SubscriptionParallaxCard({ name, price, currency, day, depth }: { name: string; price: number; currency: Currency; day: number; depth: number }) {
  const parallaxRef = useScrollParallax<HTMLDivElement>(depth);

  return (
    <div ref={parallaxRef} style={{ willChange: "transform" }} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-white px-6 py-5 shadow-sm transition-colors duration-300 hover:bg-slate-50">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-luxury-gold-soft text-sm font-bold text-luxury-gold-deep">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-luxury-text">{name}</p>
          <p className="text-sm text-luxury-text-light">Le {day} du mois</p>
        </div>
      </div>
      <p className="shrink-0 bg-gradient-to-r from-luxury-night to-luxury-sapphire bg-clip-text text-lg font-bold text-transparent">
        {formatPrice(price, currency)}
      </p>
    </div>
  );
});

export function DashboardPage() {
  const { user } = useAuth();
  const subscriptionsQuery = useSubscriptions();
  const currency = user?.currency ?? "EUR";

  const stats = useMemo(() => {
    const subs = subscriptionsQuery.data ?? [];
    const monthlyTotal = subs.reduce((sum, s) => sum + s.price, 0);
    const trialsEndingSoon = subs.filter(
      (s) => s.trial_end_date && daysUntil(s.trial_end_date) >= 0 && daysUntil(s.trial_end_date) <= 14
    ).length;
    return { monthlyTotal, count: subs.length, trialsEndingSoon };
  }, [subscriptionsQuery.data]);

  const recent = (subscriptionsQuery.data ?? []).slice(0, 5);

  return (
    <div className="w-full">
      {/* Section 1 — Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center bg-luxury-bg px-6 text-center">
        <RevealText
          as="h2"
          className="max-w-4xl break-words text-4xl font-black leading-[1.05] tracking-tight text-luxury-text sm:text-6xl lg:text-7xl"
        >
          Vos abonnements,
          <br />
          <span className="bg-gradient-to-r from-luxury-night to-luxury-sapphire bg-clip-text text-transparent">réinventés.</span>
        </RevealText>
        <RevealText className="mt-6 max-w-xl text-lg text-luxury-text-light">
          Une vue d'ensemble claire de vos dépenses récurrentes, pensée pour aller à l'essentiel.
        </RevealText>
        <CTALink to="/overview" variant="ghost" className="mt-8">
          Voir la vue d'ensemble
        </CTALink>
      </section>

      {/* Section 2 — Bento box statistiques */}
      <section className="flex min-h-[70vh] items-center bg-white px-6 py-24">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <BentoTile className="flex flex-col justify-between lg:col-span-2 lg:row-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-luxury-gold-soft text-luxury-gold-deep">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-luxury-text-light">Dépense mensuelle</p>
              <p className="mt-2 bg-gradient-to-r from-luxury-night to-luxury-sapphire bg-clip-text text-6xl font-black text-transparent">
                {formatPrice(stats.monthlyTotal, currency)}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between lg:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-luxury-text-light">Abonnements actifs</p>
              <p className="mt-1 bg-gradient-to-r from-luxury-night to-luxury-sapphire bg-clip-text text-4xl font-bold text-transparent">
                {stats.count}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-luxury-text-light">Essais qui se terminent</p>
              <p className="mt-1 bg-gradient-to-r from-luxury-night to-luxury-sapphire bg-clip-text text-3xl font-bold text-transparent">
                {stats.trialsEndingSoon}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-luxury-text-light">Statut</p>
              <p className="mt-1 bg-gradient-to-r from-luxury-night to-luxury-sapphire bg-clip-text text-3xl font-bold text-transparent">
                {user?.is_premium ? "Premium" : "Gratuit"}
              </p>
            </div>
          </BentoTile>
        </div>
      </section>

      {/* Section 3 — Abonnements actifs (parallaxe) */}
      <section className="flex min-h-screen flex-col justify-center bg-luxury-bg px-6 py-24">
        <div className="mx-auto w-full max-w-4xl">
          <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Vos abonnements actifs
          </RevealText>
          <div className="mt-12 space-y-4">
            {recent.length === 0 && (
              <p className="rounded-2xl border border-slate-900/10 bg-white shadow-sm px-6 py-10 text-center text-luxury-text-light">
                Aucun abonnement pour l'instant.
              </p>
            )}
            {recent.map((sub, index) => (
              <SubscriptionParallaxCard
                key={sub.id}
                name={sub.name}
                price={sub.price}
                currency={currency}
                day={sub.billing_day}
                depth={20 + index * 6}
              />
            ))}
          </div>
          <CTALink to="/subscriptions" variant="ghost" className="mt-8">
            Voir tous mes abonnements
          </CTALink>
        </div>
      </section>

      {/* Section 4 — Détection bancaire */}
      <section className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-luxury-gold-soft text-luxury-gold-deep">
            <Landmark className="h-6 w-6" />
          </div>
          <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text sm:text-5xl">
            Détection bancaire automatique
          </RevealText>
          <RevealText className="mx-auto mt-6 max-w-lg text-lg text-luxury-text-light">
            Connecte ta banque et laisse l'algorithme isoler tes abonnements récurrents pour toi.
          </RevealText>
          {!user?.bank_connected && (
            <CTALink to="/bank-connect" variant="solid" className="mt-8">
              Connecter ma banque
            </CTALink>
          )}
        </div>
      </section>
    </div>
  );
}
