import * as React from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { RevealText } from "@/components/shared/RevealText";
import { BentoTile } from "@/components/shared/BentoTile";
import { CTALink } from "@/components/shared/CTALink";
import { SharedSubscriptionModal } from "@/components/shared-subscription/SharedSubscriptionModal";
import { useAuth } from "@/contexts/AuthContext";
import { useExportSubscriptionsCsv, useSubscriptions } from "@/hooks/useSubscriptions";
import { STRIPE_BILLING_URL } from "@/api/config";

const PARTICULIER_TOOLS = (navigate: ReturnType<typeof useNavigate>, openSharedSubscription: () => void) => [
  {
    icon: LineChart,
    title: "Comparateur d'offres",
    description: "Compare tes abonnements aux meilleures offres du marché.",
    onClick: () => navigate("/lab/comparator"),
  },
  {
    icon: Users,
    title: "Abonnement partagé",
    description: "Partage tes abonnements et répartis les coûts entre membres.",
    onClick: openSharedSubscription,
  },
  {
    icon: FileText,
    title: "Lettre de résiliation",
    description: "Génère une lettre de résiliation prête à envoyer.",
    onClick: () => navigate("/lab/cancellation"),
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
  const [sharedSubscriptionOpen, setSharedSubscriptionOpen] = React.useState(false);
  const subscriptionsQuery = useSubscriptions();
  const exportCsv = useExportSubscriptionsCsv();

  return (
    <div className="w-full px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-luxury-gold-soft text-luxury-gold-deep">
          {user?.is_premium ? <ShieldCheck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </div>
        <RevealText as="h1" className="text-5xl font-black tracking-tight text-luxury-text sm:text-6xl">
          {user?.is_premium ? "Tu es membre Premium" : "Passe au Premium"}
        </RevealText>
        <RevealText className="mx-auto mt-4 max-w-xl text-lg text-luxury-text-light">
          {user?.is_premium
            ? "Profite du comparateur, de l'abonnement partagé illimité et des exports avancés."
            : "Débloque tous les outils pour réduire tes dépenses récurrentes, seul ou en entreprise."}
        </RevealText>
        <div className="mt-8 flex justify-center">
          <CTALink variant="solid" onClick={() => window.open(STRIPE_BILLING_URL, "_blank")}>
            {user?.is_premium ? "Gérer mon abonnement" : "Passer Premium"}
          </CTALink>
        </div>
      </div>

      <div className="mx-auto mt-24 max-w-6xl">
        <RevealText as="h2" className="text-3xl font-black tracking-tight text-luxury-text">
          Espace Particulier
        </RevealText>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PARTICULIER_TOOLS(navigate, () => setSharedSubscriptionOpen(true)).map((tool) => {
            const Icon = tool.icon;
            return (
              <BentoTile
                key={tool.title}
                onClick={tool.onClick}
                role="button"
                tabIndex={0}
                className="cursor-pointer"
              >
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
          <BentoTile
            onClick={() => exportCsv.mutate()}
            role="button"
            tabIndex={0}
            className={subscriptionsQuery.data?.length ? "cursor-pointer" : "cursor-not-allowed opacity-60"}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-luxury-gold-soft text-luxury-gold-deep">
              <Download className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-luxury-text">
              {exportCsv.isPending ? "Export en cours…" : "Export CSV"}
            </h3>
            <p className="mt-1 text-sm text-luxury-text-light">Exporte tous tes abonnements au format CSV.</p>
          </BentoTile>

          {PRO_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <BentoTile key={tool.title} className="relative opacity-70">
                <span className="absolute right-6 top-6 rounded-full border border-slate-900/10 bg-white shadow-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-luxury-text-light">
                  Bientôt disponible
                </span>
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

      <SharedSubscriptionModal
        open={sharedSubscriptionOpen}
        onOpenChange={setSharedSubscriptionOpen}
        currency={user?.currency ?? "EUR"}
      />
    </div>
  );
}
