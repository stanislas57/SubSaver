import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Wallet, ListChecks, AlertTriangle, Crown, Landmark, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { formatPrice, daysUntil } from "@/lib/format";
import type { Currency } from "@/types";

gsap.registerPlugin(ScrollTrigger);

const REDUCED_MOTION = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Révélation de texte façon Apple : masque overflow-hidden sur le conteneur,
 * translation verticale (bas -> haut) déclenchée par le scroll, pas au chargement. */
function RevealText({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "h2" | "p" }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || REDUCED_MOTION()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 1,
          ease: "power4.out",
          scrollTrigger: { trigger: wrapRef.current, start: "top 85%" },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapRef} className="overflow-hidden">
      <Tag ref={innerRef as never} className={className}>
        {children}
      </Tag>
    </div>
  );
}

function BentoTile({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED_MOTION()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={`rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.08] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function SubscriptionParallaxCard({ name, price, currency, day, depth }: { name: string; price: number; currency: Currency; day: number; depth: number }) {
  const parallaxRef = useScrollParallax<HTMLDivElement>(depth);

  return (
    <div ref={parallaxRef} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.08]">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-white">{name}</p>
          <p className="text-sm text-zinc-500">Le {day} du mois</p>
        </div>
      </div>
      <p className="shrink-0 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-lg font-bold text-transparent">
        {formatPrice(price, currency)}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
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
      <section className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <RevealText
          as="h2"
          className="max-w-4xl text-6xl font-black leading-[1.05] tracking-tight text-white sm:text-7xl"
        >
          Vos abonnements,
          <br />
          <span className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">réinventés.</span>
        </RevealText>
        <RevealText className="mt-6 max-w-xl text-lg text-zinc-400">
          Une vue d'ensemble claire de vos dépenses récurrentes, pensée pour aller à l'essentiel.
        </RevealText>
      </section>

      {/* Section 2 — Bento box statistiques */}
      <section className="flex min-h-[70vh] items-center bg-zinc-950 px-6 py-24">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
          <BentoTile className="flex flex-col justify-between lg:col-span-2 lg:row-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Dépense mensuelle</p>
              <p className="mt-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-6xl font-black text-transparent">
                {formatPrice(stats.monthlyTotal, currency)}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between lg:col-span-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Abonnements actifs</p>
              <p className="mt-1 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-bold text-transparent">
                {stats.count}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Essais qui se terminent</p>
              <p className="mt-1 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-3xl font-bold text-transparent">
                {stats.trialsEndingSoon}
              </p>
            </div>
          </BentoTile>

          <BentoTile className="flex flex-col justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Statut</p>
              <p className="mt-1 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-3xl font-bold text-transparent">
                {user?.is_premium ? "Premium" : "Gratuit"}
              </p>
            </div>
          </BentoTile>
        </div>
      </section>

      {/* Section 3 — Abonnements actifs (parallaxe) */}
      <section className="flex min-h-screen flex-col justify-center bg-black px-6 py-24">
        <div className="mx-auto w-full max-w-4xl">
          <RevealText as="h2" className="text-5xl font-black tracking-tight text-white">
            Vos abonnements actifs
          </RevealText>
          <div className="mt-12 space-y-4">
            {recent.length === 0 && (
              <p className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-zinc-500">
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
          <button
            onClick={() => navigate("/subscriptions")}
            className="mt-8 flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Voir tous les abonnements
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Section 4 — Détection bancaire */}
      <section className="flex min-h-[70vh] items-center justify-center bg-zinc-950 px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
            <Landmark className="h-6 w-6" />
          </div>
          <RevealText as="h2" className="text-5xl font-black tracking-tight text-white">
            Détection bancaire automatique
          </RevealText>
          <RevealText className="mx-auto mt-6 max-w-lg text-lg text-zinc-400">
            Connecte ta banque et laisse l'algorithme isoler tes abonnements récurrents pour toi.
          </RevealText>
          {!user?.bank_connected && (
            <button
              onClick={() => navigate("/subscriptions")}
              className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:scale-105"
            >
              Connecter ma banque
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
