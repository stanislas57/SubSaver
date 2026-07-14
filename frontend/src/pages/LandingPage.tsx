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
import { ConsentBanner } from "@/components/consent/ConsentBanner";

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
    q: "Quelle est la meilleure application pour suivre ses abonnements ?",
    a: "Une bonne application de suivi d'abonnements doit détecter automatiquement vos prélèvements récurrents depuis votre historique bancaire, sans ressaisie manuelle. SubSaver scanne vos transactions passées, classe chaque abonnement par catégorie et vous alerte dès qu'un prix augmente.",
  },
  {
    q: "Comment résilier un abonnement facilement ?",
    a: "Une fois vos abonnements détectés, SubSaver centralise les liens et informations de résiliation de chaque service dans votre tableau de bord, pour éviter de chercher la procédure sur chaque site.",
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

const DEPENSES_MOYENNES = [
  { categorie: "Streaming vidéo (Netflix, Disney+, Prime...)", moyenne: "18 € / mois", risque: "Hausses de prix fréquentes" },
  { categorie: "Streaming musical (Spotify, Deezer...)", moyenne: "10 € / mois", risque: "Changement d'offre silencieux" },
  { categorie: "Salle de sport & bien-être", moyenne: "35 € / mois", risque: "Reconduction tacite" },
  { categorie: "Stockage cloud & logiciels", moyenne: "12 € / mois", risque: "Essais gratuits oubliés" },
  { categorie: "Presse & actualités en ligne", moyenne: "9 € / mois", risque: "Abonnements fantômes" },
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
      <section className="relative flex h-[100svh] flex-col items-center justify-center overflow-hidden bg-luxury-night px-6 py-0">
        <GoldParticles />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full bg-luxury-gold/10 blur-[140px]" />
          <div className="absolute -right-32 bottom-0 h-[380px] w-[380px] rounded-full bg-luxury-sapphire/30 blur-[140px]" />
        </div>

        <button
          onClick={() => navigate("/login")}
          className="absolute right-6 top-6 text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-luxury-gold"
        >
          Se connecter
        </button>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="mb-8 flex items-center gap-3">
            <img src="/logo-dark-bg.svg" alt="SubSaver" width={40} height={40} className="h-10 w-auto" />
            <span className="font-display text-xl font-bold tracking-tight text-slate-50">SubSaver</span>
          </div>

          <RevealText as="h1" className="text-4xl font-black leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Le suivi de vos abonnements, <span className="text-luxury-gold whitespace-nowrap">enfin sous&nbsp;contrôle.</span>
          </RevealText>
          <RevealText className="mt-5 max-w-xl text-lg text-slate-300">
            SubSaver est l'application qui connecte votre banque, détecte automatiquement tous vos abonnements
            récurrents et repère les hausses de prix silencieuses — pour que vous puissiez comparer, partager ou
            résilier en un clic, sans paperasse.
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
            Un tableau de bord clair pour gérer tous vos abonnements
          </RevealText>
          <RevealText className="mx-auto mt-4 max-w-xl text-luxury-text-light">
            Aperçu illustratif de l'interface — vos propres montants et abonnements récurrents apparaissent dès la
            première synchronisation bancaire.
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
            Comment fonctionne le suivi automatique d'abonnements
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
                  <h3 className="mt-1 text-base font-bold text-luxury-text">{step.title}</h3>
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
            Où se cachent vos économies sur les abonnements
          </RevealText>
          <RevealText className="mx-auto mt-4 max-w-xl text-center text-luxury-text-light">
            Trois fuites récurrentes que le suivi automatique de SubSaver isole dans votre historique bancaire.
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

      {/* ---------- Budget moyen par catégorie ---------- */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RevealText as="h2" className="text-center text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Combien vous coûtent réellement vos abonnements ?
          </RevealText>
          <RevealText className="mx-auto mt-4 max-w-xl text-center text-luxury-text-light">
            Budget mensuel moyen constaté par catégorie d'abonnement, et le principal risque de dérapage à
            surveiller.
          </RevealText>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-900/10">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-luxury-bg text-xs font-bold uppercase tracking-wide text-luxury-text-light">
                  <th className="px-5 py-3">Catégorie d'abonnement</th>
                  <th className="px-5 py-3">Budget moyen</th>
                  <th className="px-5 py-3">Risque fréquent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/10">
                {DEPENSES_MOYENNES.map((row) => (
                  <tr key={row.categorie}>
                    <td className="px-5 py-3 font-semibold text-luxury-text">{row.categorie}</td>
                    <td className="px-5 py-3 text-luxury-text">{row.moyenne}</td>
                    <td className="px-5 py-3 text-luxury-text-light">{row.risque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-xs text-luxury-text-light">
            Estimations à titre indicatif — SubSaver calcule vos montants réels dès la connexion de votre banque.
          </p>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <RevealText as="h2" className="text-center text-3xl font-black tracking-tight text-luxury-text sm:text-4xl">
            Questions fréquentes sur le suivi d'abonnements
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
          Prêt à reprendre le contrôle de vos abonnements ?
        </RevealText>
        <RevealText className="mx-auto mt-4 max-w-md text-slate-300">
          Rejoignez SubSaver gratuitement et découvrez en 30 secondes combien vos abonnements vous coûtent vraiment.
        </RevealText>
        <div className="mt-8 flex justify-center">
          <CTALink variant="solid" onClick={() => navigate("/register")} className="px-10 py-4 text-base">
            Essayer gratuitement, sans carte bancaire
          </CTALink>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-slate-900/5 bg-white px-6 py-10 text-center text-xs text-luxury-text-light">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="SubSaver" width={20} height={20} className="h-5 w-auto" />
            <span className="font-semibold text-luxury-text">SubSaver</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="/guide-abonnements" className="hover:text-luxury-text">Guide des abonnements</a>
            <a href="/privacy" className="hover:text-luxury-text">Confidentialité &amp; RGPD</a>
            <a href="/mentions-legales" className="hover:text-luxury-text">Mentions légales</a>
            <a href="#apercu" className="hover:text-luxury-text">Aperçu</a>
            <a href="mailto:contact.subsaver@proton.me" className="hover:text-luxury-text">Contact</a>
          </div>
        </div>
        {/* Raison sociale + statut EI exigés par la LCEN (Art. 6-III) sur toute page du site. */}
        <p className="mt-6">
          © {new Date().getFullYear()} SubSaver — Stanislas Humbert, EI (Entrepreneur Individuel). Tous droits
          réservés.
        </p>
      </footer>

      <ConsentBanner />
    </div>
  );
}
