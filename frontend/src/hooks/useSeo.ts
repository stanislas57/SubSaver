import { useEffect } from "react";

export interface SeoOptions {
  title: string;
  description: string;
  /** Chemin absolu de la page, ex "/guide-abonnements". Sert à poser un
   * <link rel="canonical"> propre à CETTE route -- sans quoi la balise
   * canonical statique d'index.html (qui pointe vers "/") s'applique à
   * toutes les pages de la SPA, ce qui indique à Google que chaque page est
   * un doublon de la landing et peut l'empêcher de les indexer séparément. */
  path: string;
  /** JSON-LD (schema.org) à injecter dans le <head> le temps que la page est montée. */
  jsonLd?: Record<string, unknown>;
}

const SITE_ORIGIN = "https://subsaver.fr";

/** Cette SPA n'a pas de gestion de <head> par route (pas de react-helmet) --
 * ce hook met à jour le titre, la meta description et le canonical au
 * montage, et les restaure à la démontage pour ne pas polluer les autres
 * pages. Nécessaire pour toute page publique destinée au référencement (les
 * balises statiques d'index.html ne concernent que la landing "/"). */
export function useSeo({ title, description, path, jsonLd }: SeoOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute("content") ?? null;
    descriptionTag?.setAttribute("content", description);

    const canonicalTag = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonicalTag?.getAttribute("href") ?? null;
    canonicalTag?.setAttribute("href", `${SITE_ORIGIN}${path}`);

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
      if (previousCanonical !== null) {
        canonicalTag?.setAttribute("href", previousCanonical);
      }
      if (script) document.head.removeChild(script);
    };
  }, [title, description, path, jsonLd]);
}
