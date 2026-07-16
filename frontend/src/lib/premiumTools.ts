import { LineChart, Users, FileText, FileSpreadsheet, Receipt, Landmark, Wallet } from "lucide-react";

export const PARTICULIER_TOOLS = [
  {
    icon: LineChart,
    title: "Comparateur d'offres",
    description: "Trouve de meilleures offres pour réduire tes factures : on compare tes abonnements au marché en continu.",
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
  {
    icon: Wallet,
    title: "Vos Ressources",
    description:
      "Détecte ton salaire et optimise ton budget : reste à vivre, répartiteur de budget et académie de l'épargne.",
    path: "/ressources",
  },
] as const;

/** Outils Espace Pro / BtoB (Premium) -- utilisés à la fois par PremiumPage
 * (tuiles) et PremiumUpsellScreen (paywall contextuel affiché en cas d'accès
 * direct à l'URL sans être Premium). "Extraction comptable" n'a volontairement
 * pas de `path` : c'est un téléchargement direct (cf. useExportAccounting),
 * pas une page -- rien à faire correspondre côté PremiumUpsellScreen pour elle. */
export const BTOB_TOOLS = [
  {
    icon: FileSpreadsheet,
    title: "Extraction comptable",
    description: "Exporte tes dépenses récurrentes au format compatible avec ton logiciel comptable.",
  },
  {
    icon: Receipt,
    title: "Récupération de TVA",
    description: "Identifie automatiquement la TVA récupérable sur tes abonnements professionnels.",
    path: "/pro/vat-recovery",
  },
  {
    icon: Landmark,
    title: "Détection des frais bancaires",
    description: "Repère les frais et commissions bancaires cachés dans tes relevés.",
    path: "/pro/bank-fees",
  },
] as const;
