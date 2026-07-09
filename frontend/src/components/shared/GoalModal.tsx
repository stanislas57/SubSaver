import { PiggyBank, Bell, Ghost, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OnboardingSteps } from "@/components/shared/OnboardingSteps";
import { cn } from "@/lib/utils";

export type Goal = "reduce" | "alerts" | "ghosts" | "explore";

const GOALS: { id: Goal; icon: typeof PiggyBank; title: string; detail: string }[] = [
  { id: "reduce", icon: PiggyBank, title: "Réduire mes abonnements", detail: "Repérer ce qui coûte le plus et où couper." },
  { id: "alerts", icon: Bell, title: "Traquer les hausses de prix", detail: "Être alerté dès qu'un tarif augmente." },
  { id: "ghosts", icon: Ghost, title: "Débusquer les abonnements fantômes", detail: "Retrouver ce que j'ai oublié de résilier." },
  { id: "explore", icon: Sparkles, title: "Juste explorer", detail: "Voir ce que SubSaver peut faire, sans objectif précis." },
];

export interface GoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (goal: Goal) => void;
}

/** Étape 2/3 de l'activation : capture l'intention avant de demander l'accès
 * bancaire (étape la plus sensible du parcours), pour que la connexion
 * Powens qui suit ne tombe jamais "à froid". Non-bloquant comme
 * BankConnectPromptModal -- choisir un objectif n'est pas un pré-requis
 * technique, seulement un contexte utile. Le choix est mémorisé en
 * LocalStorage (cf. GoalGate) : aucun champ backend dédié n'existe pour le
 * moment, donc pas de personnalisation serveur, seulement une trace locale. */
export function GoalModal({ open, onOpenChange, onSelect }: GoalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <OnboardingSteps current={2} />
        <DialogHeader>
          <DialogTitle className="text-xl">Qu'est-ce qui t'amène ?</DialogTitle>
          <DialogDescription>
            Un repère rapide pour te montrer ce qui compte le plus dès ta première visite. Modifiable à tout moment.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GOALS.map((goal) => {
            const Icon = goal.icon;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => onSelect(goal.id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border border-slate-900/10 bg-luxury-bg/60 p-4 text-left transition-colors duration-200",
                  "hover:border-luxury-gold/50 hover:bg-luxury-gold-soft"
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-luxury-night text-luxury-gold">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm font-bold text-luxury-text">{goal.title}</span>
                <span className="text-xs text-luxury-text-light">{goal.detail}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
