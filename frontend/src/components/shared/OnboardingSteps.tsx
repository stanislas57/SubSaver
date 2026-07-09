import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Charte", "Objectif", "Connexion bancaire"] as const;

/** Repère de progression affiché sur les gates d'activation (charte, objectif,
 * connexion bancaire) pour que l'utilisateur sache toujours combien d'étapes le
 * séparent du dashboard -- ces écrans s'enchaînaient jusqu'ici sans aucun fil
 * conducteur. */
export function OnboardingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="mb-5 flex items-center gap-2 text-xs font-medium text-luxury-text-light">
      {STEPS.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && <span className="h-px w-4 bg-slate-900/10" aria-hidden />}
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                done && "bg-luxury-night text-luxury-gold",
                active && "bg-luxury-gold-soft text-luxury-gold-deep",
                !done && !active && "bg-slate-900/5 text-luxury-text-light"
              )}
            >
              {done ? <Check className="h-3 w-3" /> : step}
            </span>
            <span className={cn(active && "font-bold text-luxury-text")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
