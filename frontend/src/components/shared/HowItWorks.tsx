import { Landmark, ScanSearch, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Landmark,
    title: "Connectez votre banque",
    detail: "En toute sécurité, en 30 secondes.",
  },
  {
    icon: ScanSearch,
    title: "L'algorithme scanne",
    detail: "Vos transactions, automatiquement.",
  },
  {
    icon: ListChecks,
    title: "Contrôlez et résiliez",
    detail: "Vos abonnements, en un clic.",
  },
];

export interface HowItWorksProps {
  /** "light" : pour les pages à fond clair (icônes Bleu Nuit + texte foncé).
   * "dark" : pour les fonds Bleu Nuit comme /login (icônes/texte clairs). */
  variant?: "light" | "dark";
  className?: string;
}

/** Bandeau "Comment ça marche" en 3 étapes, réutilisé sur /login et
 * en introduction de la Vue d'ensemble. Chaque variante garde un contraste
 * fort entre l'icône (puce Bleu Nuit ou dorée) et son fond. */
export function HowItWorks({ variant = "light", className }: HowItWorksProps) {
  const isDark = variant === "dark";

  return (
    <div className={cn("grid grid-cols-1 gap-6 sm:grid-cols-3", className)}>
      {STEPS.map((step) => {
        const Icon = step.icon;
        return (
          <div key={step.title} className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                isDark ? "bg-white/10 text-luxury-gold" : "bg-luxury-night text-luxury-gold"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", isDark ? "text-slate-50" : "text-luxury-text")}>
                {step.title}
              </p>
              <p className={cn("mt-0.5 text-xs", isDark ? "text-slate-400" : "text-luxury-text-light")}>
                {step.detail}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
