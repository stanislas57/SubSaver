import { Sparkles, LineChart, Users, FileDown, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FeatureBox } from "@/components/shared/FeatureBox";
import { useAuth } from "@/contexts/AuthContext";
import { STRIPE_BILLING_URL } from "@/api/config";

export function PremiumPage() {
  const { user } = useAuth();

  if (user?.is_premium) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-accent">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-text-main">Tu es déjà membre Premium</h2>
          <p className="text-sm text-text-muted">Profite du comparateur, du mode famille illimité et des exports avancés.</p>
          <Button variant="outline" onClick={() => window.open(STRIPE_BILLING_URL, "_blank")}>
            Gérer mon abonnement
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-accent">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="font-display text-2xl font-bold text-text-main">Passe au Premium</h2>
        <p className="mt-2 text-sm text-text-muted">Débloque tous les outils pour réduire tes dépenses récurrentes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FeatureBox icon={<LineChart className="h-5 w-5" />} title="Comparateur d'offres" description="Compare tes abonnements aux meilleures offres du marché." />
        <FeatureBox icon={<Users className="h-5 w-5" />} title="Mode Famille illimité" description="Partage et répartis les coûts avec tous les membres du foyer." />
        <FeatureBox icon={<FileDown className="h-5 w-5" />} title="Exports avancés" description="Exporte tes données en CSV à tout moment." />
      </div>

      <div className="flex justify-center">
        <Button variant="premium" size="lg" onClick={() => window.open(STRIPE_BILLING_URL, "_blank")}>
          <Sparkles className="h-4 w-4" /> Passer Premium
        </Button>
      </div>
    </div>
  );
}
