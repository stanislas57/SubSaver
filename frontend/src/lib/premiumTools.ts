import { LineChart, Users, FileText } from "lucide-react";

export const PARTICULIER_TOOLS = [
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
] as const;
