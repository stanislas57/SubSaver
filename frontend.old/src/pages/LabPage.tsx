import * as React from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, FileText, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FamilyModal } from "@/components/family/FamilyModal";
import { useAuth } from "@/contexts/AuthContext";

export function LabPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [familyOpen, setFamilyOpen] = React.useState(false);

  const tools = [
    {
      icon: <LineChart className="h-5 w-5" />,
      title: "Comparateur d'offres",
      description: "Compare tes abonnements aux meilleures offres du marché.",
      onClick: () => navigate("/lab/comparator"),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Lettre de résiliation",
      description: "Génère une lettre de résiliation prête à envoyer.",
      onClick: () => navigate("/lab/cancellation"),
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Mode Famille",
      description: "Partage tes abonnements et répartis les coûts.",
      onClick: () => setFamilyOpen(true),
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">Des outils pour t'aider à mieux gérer et réduire tes abonnements.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.title} className="cursor-pointer hover:border-primary" onClick={tool.onClick}>
            <CardContent className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary">
                {tool.icon}
              </div>
              <h4 className="font-display text-sm font-bold text-text-main">{tool.title}</h4>
              <p className="mt-1 text-sm text-text-muted">{tool.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FamilyModal open={familyOpen} onOpenChange={setFamilyOpen} currency={user?.currency ?? "EUR"} />
    </div>
  );
}
