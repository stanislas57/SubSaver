import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  LineChart,
  Users,
  FileText,
  ShieldCheck,
  Building2,
  Receipt,
  FileSpreadsheet,
  Landmark,
  Download,
  Lock,
} from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { CTALink } from "@/components/shared/CTALink";
import { useAuth } from "@/contexts/AuthContext";
import { useExportSubscriptionsCsv, useSubscriptions } from "@/hooks/useSubscriptions";
import { STRIPE_BILLING_URL } from "@/api/config";
import { cn } from "@/lib/utils";

const PARTICULIER_TOOLS = [
  {
    icon: LineChart,
    title: "Comparateur d'offres",
    description: "Compare tes abonnements aux meilleures offres du marché.",
    path: "/lab/comparator",
  },
  {
    icon: Users,
    title: "Abonnement partagé",
    description: "Partage tes abonnements et répartis les coûts entre membres.",
    path: "/lab/shared",
  },
  {
    icon: FileText,
    title: "Lettre de résiliation",
    description: "Génère une lettre de résiliation prête à envoyer.",
    path: "/lab/cancellation",
  },
];

const PRO_TOOLS = [
  {
    icon: FileSpreadsheet,
    title: "Extraction comptable",
    description: "Exporte tes dépenses récurrentes au format compatible avec ton logiciel comptable.",
  },
  {
    icon: Receipt,
    title: "Récupération de TVA",
    description: "Identifie automatiquement la TVA récupérable sur tes abonnements professionnels.",
  },
  {
    icon: Landmark,
    title: "Détection des frais bancaires",
    description: "Repère les frais et commissions bancaires cachés dans tes relevés.",
  },
];

export function PremiumPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPremium = !!user?.is_premium;
  const subscriptionsQuery = useSubscriptions();
  const exportCsv = useExportSubscriptionsCsv();

  /** Redirige vers Stripe si non-Premium, sinon lance l'export réel.
   * Navigation dans le même onglet (pas de window.open) : Stripe doit
   * pouvoir rediriger cet onglet vers /premium?success=true au retour,
   * pour que l'app détecte le paiement et débloque isPremium. */
  function handleExportCsvClick() {
    if (!isPremium) {
      window.location.href = STRIPE_BILLING_URL;
      return;
    }
    exportCsv.mutate();
  }

  /** Les 3 modules "Espace Particulier" ont désormais de vraies pages :
   * Premium -> navigation directe ; non-Premium -> redirection Stripe
   * (le cadenas les distingue visuellement avant même le clic). */
  function handleParticulierClick(path: string) {
    if (!isPremium) {
      window.location.href = STRIPE_BILLING_URL;
      return;
    }
    navigate(path);
  }

  return (
    <div className="w-full px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-luxury-gold-soft text-luxury-gold-deep">
          {isPremium ? <ShieldCheck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </div>

        {isPremium && (
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-luxury-night px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-luxury-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Statut : Membre Premium
          </span>
        )}

        <RevealText as="h1" className="text-5xl font-black tracking-tight text-luxury-text sm:text-6xl">
          {isPremium ? "Tu es membre Premium" : "Passe au Premium"}
        </RevealText>
        <RevealText className="mx-auto mt-4 max-w-xl text-lg text-luxury-text-light">
          {isPremium
            ? "Profite du comparateur, de l'abonnement partagé illimité et des exports avancés."
            : "Débloque tous les outils pour réduire tes dépenses récurrentes, seul ou en entreprise."}
        </RevealText>
        <div className="mt-8 flex justify-center">
          <CTALink variant="solid" onClick={() => (window.location.href = STRIPE_BILLING_URL)}>
            {isPremium ? "Gérer mon abonnement" : "Passer Premium"}
          </CTALink>
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-6xl">
        <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text">
          Espace Particulier
        </RevealText>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PARTICULIER_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <BentoTile
                key={tool.title}
                onClick={() => handleParticulierClick(tool.path)}
                role="button"
                tabIndex={0}
                className={cn("relative cursor-pointer", !isPremium && "opacity-70")}
              >
                <AnimatePresence>
                  {!isPremium && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5, rotate: 15 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.4, rotate: -20 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-luxury-night text-luxury-gold"
                    >
                      <Lock className="h-3.5 w-3.5" />
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-luxury-text">{tool.title}</h3>
                <p className="mt-1 text-sm text-luxury-text-light">{tool.description}</p>
              </BentoTile>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-6xl">
        <div className="flex items-center gap-3">
          <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text">
            Espace Pro / BtoB
          </RevealText>
          <Building2 className="mb-1 h-6 w-6 text-luxury-text-light" />
        </div>
        <p className="mt-2 text-sm text-luxury-text-light">Pensé pour les indépendants et les entreprises.</p>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Export CSV : seul outil Pro réellement fonctionnel. Verrouillé tant que
           * non-Premium (clic -> Stripe), débloqué instantanément une fois Premium. */}
          <BentoTile
            onClick={handleExportCsvClick}
            role="button"
            tabIndex={0}
            className={cn(
              "relative",
              !isPremium
                ? "cursor-pointer opacity-70"
                : subscriptionsQuery.data?.length
                  ? "cursor-pointer"
                  : "cursor-not-allowed opacity-60"
            )}
          >
            <AnimatePresence>
              {!isPremium && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.5, rotate: 15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.4, rotate: -20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-luxury-night text-luxury-gold"
                >
                  <Lock className="h-3.5 w-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-luxury-text">
              {exportCsv.isPending ? "Export en cours…" : "Export CSV"}
            </h3>
            <p className="mt-1 text-sm text-luxury-text-light">
              {isPremium ? "Exporte tous tes abonnements au format CSV." : "Fonctionnalité Premium — clique pour débloquer."}
            </p>
          </BentoTile>

          {/* Extraction comptable / TVA / Frais bancaires : roadmap, pas encore
           * connectées à un backend. Le cadenas indique qu'elles seront réservées
           * aux membres Premium une fois lancées ; non cliquables pour l'instant,
           * y compris pour les membres Premium. */}
          {PRO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <BentoTile key={tool.title} className="relative opacity-70">
                <div className="absolute right-6 top-6 flex items-center gap-1.5">
                  <AnimatePresence>
                    {!isPremium && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-luxury-night text-luxury-gold"
                      >
                        <Lock className="h-3 w-3" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="rounded-full border border-slate-900/10 bg-white shadow-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-luxury-text-light">
                    Bientôt disponible
                  </span>
                </div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-luxury-text">{tool.title}</h3>
                <p className="mt-1 text-sm text-luxury-text-light">{tool.description}</p>
              </BentoTile>
            );
          })}
        </div>
      </div>
    </div>
  );
}
