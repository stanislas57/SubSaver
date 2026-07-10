import { useEffect } from "react";

export interface SeoOptions {
  title: string;
  description: string;
  /** JSON-LD (schema.org) à injecter dans le <head> le temps que la page est montée. */
  jsonLd?: Record<string, unknown>;
}

/** Cette SPA n'a pas de gestion de <head> par route (pas de react-helmet) --
 * ce hook met à jour le titre et la meta description au montage, et les
 * restaure à la démentage pour ne pas polluer les autres pages. Nécessaire
 * pour toute page publique destinée au référencement (le titre/description
 * statiques d'index.html ne concernent que la landing "/"). */
export function useSeo({ title, description, jsonLd }: SeoOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute("content") ?? null;
    descriptionTag?.setAttribute("content", description);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previousTitle;
      if (previousDescription !== null) {
        descriptionTag?.setAttribute("content", previousDescription);
      }
      if (script) document.head.removeChild(script);
    };
  }, [title, description, jsonLd]);
}
