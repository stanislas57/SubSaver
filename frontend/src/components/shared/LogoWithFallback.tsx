import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogoWithFallbackProps {
  domain: string;
  name: string;
  className?: string;
}

/** Palette de repli -- teintes douces, choisies pour rester lisibles avec un
 * texte en gras dessus. Le nom (pas le domaine, souvent deviné/absent)
 * détermine la couleur : un même abonnement garde toujours la même teinte
 * d'une session à l'autre, plutôt qu'une couleur qui change à chaque rendu. */
const FALLBACK_PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

function fallbackColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

/** Logo via Clearbit, avec repli sur l'initiale du nom (fond coloré, stable
 * par abonnement) si l'image échoue ou si aucun domaine n'est disponible --
 * systématique pour un abonnement ajouté manuellement depuis que le champ
 * domaine a été retiré du formulaire, cf. SubscriptionForm.tsx. */
export function LogoWithFallback({ domain, name, className }: LogoWithFallbackProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed || !domain) {
    return (
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold",
          fallbackColorFor(name),
          className
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}?size=80`}
      alt={name}
      width={40}
      height={40}
      className={cn("h-10 w-10 shrink-0 rounded-md border border-border object-contain bg-white p-1", className)}
      onError={() => setFailed(true)}
    />
  );
}
