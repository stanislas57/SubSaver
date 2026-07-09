import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Landmark,
  ScanSearch,
  ListChecks,
  Wallet,
  TrendingDown,
  Bell,
  Sparkles,
  Lock,
  ArrowRight,
} from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";
import { CTALink } from "@/components/shared/CTALink";
import { BentoTile } from "@/components/shared/BentoTile";
import { GoldParticles } from "@/components/auth/GoldParticles";
import { TiltCard } from "@/components/ui/tilt-card";
import { formatPrice } from "@/lib/format";

const STEPS = [
  {
    icon: Landmark,
    title: "Connectez votre banque",
    detail: "Via Powens, agréé ACPR — en toute sécurité, en 30 secondes.",
  },
  {
    icon: ScanSearch,
    title: "L'algorithme scanne",
    detail: "Vos transactions passées, pour isoler chaque montant récurrent.",
  },
  {
    icon: ListChecks,
    title: "Contrôlez et résiliez",
    detail: "Comparez, partagez ou résiliez vos abonnements en un clic.",
  },
];

const FAQ = [
  {
    q: "Est-ce vraiment gratuit pour commencer ?",
    a: "Oui. La détection de vos abonnements et le tableau de bord de base sont accessibles sans carte bancaire. Le Premium n'est nécessaire que pour le comparateur d'offres, le partage de frais et les exports avancés.",
  },
  {
    q: "Comment SubSaver accède-t-il à mes données bancaires ?",
    a: "Via Powens, établissement de paiement agréé par l'ACPR dans le respect de la directive européenne DSP2. Vos identifiants bancaires ne transitent jamais par nos serveurs, et nous n'avons aucun accès à votre IBAN ni à la possibilité d'effectuer une opération sur votre compte.",
  },
  {
    q: "Puis-je déconnecter ma banque à tout moment ?",
    a: "Oui, depuis votre Profil. La déconnexion révoque immédiatement l'accès de Powens à vos données, sans démarche supplémentaire.",
  },
  {
    q: "Que se passe-t-il si je résilie mon abonnement Premium ?",
    a: "Vous conservez l'accès à la détection d'abonnements et au tableau de bord ; seules les fonctionnalités Premium (comparateur, partage, exports) redeviennent verrouillées.",
  },
];

/** Landing page publique — n'existait pas jusqu'ici, la racine "/" redirigeait
 * directement vers /overview (post-connexion). Reprend le thème Luxe (Bleu Nuit
 * & Or) déjà utilisé sur /login pour la cohérence visuelle, sans nouveau système
 * de design. Rendue uniquement aux visiteurs non authentifiés (cf. RootPage). */
export function LandingPage() {
  const navigate = useNavigate();

  function scrollToPreview() {
    document.getElementById("apercu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="bg-luxury-bg">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-luxury-night px-6 pb-28 pt-10">
        <GoldParticles />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-luxury-gold/10 blur-[140px]" />
          <div className="absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-luxury-sapphire/30 blur-[140px]" />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo-dark-bg.svg" alt="SubSaver" className="h-10 w-auto" />
            <span className="font-display text-xl font-bold tracking-tight text-slate-50">SubSaver</span>
          </div>

          <RevealText as="h1" className="text-4xl font-black leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Vos abonnements, <span className="text-luxury-gold">sous contrôle.</span>
          </RevealText>
          <RevealText className="mt-5 max-w-xl text-lg text-slate-300">
            SubSaver connecte votre banque, détecte tous vos abonnements récurrents et repère les hausses de prix
            silencieuses — automatiquement, sans paperasse.
          </RevealText>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <CTALink variant="solid" onClick={() => navigate("/register")} className="px-10 py-4 text-base">
              Essayer gratuitement
            </CTALink>
            <CTALink variant="ghost" onClick={scrollToPreview} className="text-slate-300 hover:text-luxury-gold">
              Voir un aperçu
            </CTALink>
          </div>
          <p className="mt-5 text-xs text-slate-400">Sans carte bancaire · Connexion bancaire chiffrée de bout en bout</p>
        </div>
      </section>

      {/* ---------- Confiance / conformité ---------- */}
      <section className="border-b border-slate-900/5 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-luxury-bg px-3.5 py-1.5 text-xs font-semibold text-luxury-text-light">
            <ShieldCheck className="h-3.5 w-3.5 text-luxury-gold-deep" /> Powens, agréé ACPR
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-luxury-bg px-3.5 py-1.5 text-xs font-semibold text-luxury-text-light">
            <Lock className="h-3.5 w-3.5 text-luxury-gold-deep" /> Conforme DSP2
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-luxury-bg px-3.5 py-1.5 text-xs font-semibold text-luxury-text-light">
            <Landmark className="h-3.5 w-3.5 text-luxury-gold-deep" /> Banques françaises compatibles
          </span>
        </div>
      </section>

      {/* ---------- Aperçu du dashboard ---------- */}
      <section id="apercu" className="px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Un tableau de bord qui parle clair
          </RevealText>
          <RevealText className="mx-auto mt-4 max-w-xl text-luxury-text-light">
            Aperçu illustratif de l'interface — vos propres montants apparaissent dès la première synchronisation.
          </RevealText>
        </div>

        <TiltCard className="mx-auto mt-12 max-w-3xl !bg-white/80 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-luxury-night p-5 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-luxury-gold/15 text-luxury-gold">
                <Wallet className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 text-xs font-medium text-luxury-gold">Total mensuel</p>
              <p className="mt-1 text-2xl font-black text-white">{formatPrice(87.4, "EUR")}</p>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-white p-5 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-luxury-gold-soft text-luxury-gold-deep">
                <TrendingDown className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 text-xs font-medium text-luxury-text-light">Évolution (MoM)</p>
              <p className="mt-1 text-2xl font-black text-luxury-text">-12,3 %</p>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-white p-5 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-luxury-gold-soft text-luxury-gold-deep">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 text-xs font-medium text-luxury-text-light">Alertes actives</p>
              <p className="mt-1 text-2xl font-black text-luxury-text">2 hausses détectées</p>
            </div>
          </div>
        </TiltCard>
      </section>

      {/* ---------- 3 étapes ---------- */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <RevealText as="h2" className="text-center text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Comment ça marche
          </RevealText>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-luxury-night text-luxury-gold">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-luxury-gold-deep">
                    Étape {i + 1}
                  </p>
                  <p className="mt-1 text-base font-bold text-luxury-text">{step.title}</p>
                  <p className="mt-2 text-sm text-luxury-text-light">{step.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Économies potentielles ---------- */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <RevealText as="h2" className="text-center text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Où se cachent vos économies
          </RevealText>
          <RevealText className="mx-auto mt-4 max-w-xl text-center text-luxury-text-light">
            Trois fuites récurrentes que SubSaver isole automatiquement dans votre historique bancaire.
          </RevealText>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <BentoTile>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-luxury-text">Hausses de prix silencieuses</h3>
              <p className="mt-1 text-sm text-luxury-text-light">
                Les abonnements augmentent rarement d'un coup — SubSaver compare chaque prélèvement au précédent.
              </p>
            </BentoTile>
            <BentoTile>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-luxury-text">Abonnements fantômes</h3>
              <p className="mt-1 text-sm text-luxury-text-light">
                Essais gratuits oubliés, services jamais résiliés : le prélèvement continue, l'usage a cessé.
              </p>
            </BentoTile>
            <BentoTile>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                <Landmark className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-luxury-text">Frais bancaires cachés</h3>
              <p className="mt-1 text-sm text-luxury-text-light">
                Commissions et frais récurrents noyés dans le relevé, rarement identifiés comme tels.
              </p>
            </BentoTile>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <RevealText as="h2" className="text-center text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Questions fréquentes
          </RevealText>
          <div className="mt-10 divide-y divide-slate-900/10 rounded-2xl border border-slate-900/10">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-5 open:bg-luxury-bg/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-luxury-text">
                  {item.q}
                  <ArrowRight className="h-4 w-4 shrink-0 text-luxury-gold-deep transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-luxury-text-light">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="bg-luxury-night px-6 py-20 text-center">
        <RevealText as="h2" className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Prêt à reprendre le contrôle ?
        </RevealText>
        <div className="mt-8 flex justify-center">
          <CTALink variant="solid" onClick={() => navigate("/register")} className="px-10 py-4 text-base">
            Essayer gratuitement
          </CTALink>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-slate-900/5 bg-white px-6 py-10 text-center text-xs text-luxury-text-light">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="SubSaver" className="h-5 w-auto" />
            <span className="font-semibold text-luxury-text">SubSaver</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="/privacy" className="hover:text-luxury-text">Confidentialité &amp; RGPD</a>
            <a href="#apercu" className="hover:text-luxury-text">Aperçu</a>
            <a href="mailto:contact.subsaver@proton.me" className="hover:text-luxury-text">Contact</a>
          </div>
        </div>
        <p className="mt-6">© {new Date().getFullYear()} SubSaver. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
