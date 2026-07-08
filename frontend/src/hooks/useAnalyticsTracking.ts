/**
 * Scaffold de tracking comportemental -- prêt à brancher sur un outil pro
 * (PostHog, Vercel Analytics, Google Analytics) sans toucher au reste de
 * l'app. Le tracking natif des clics/du parcours n'est PAS réimplémenté ici
 * pour des raisons de performance (payload, respect du Do Not Track,
 * échantillonnage...) : ces outils le font mieux que du code maison.
 *
 * Pour activer un fournisseur, implémente `sendEvent` ci-dessous, par ex. :
 *   PostHog   : posthog.capture(name, properties)
 *   Vercel    : va.track(name, properties)  (import { track } from "@vercel/analytics")
 *   GA4       : gtag("event", name, properties)
 * et charge le script correspondant une seule fois (ex: dans main.tsx ou
 * via un <script> dans index.html), avant que ce hook ne soit utilisé.
 */

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

function sendEvent(name: string, properties?: AnalyticsEventProperties): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", name, properties ?? {});
  }
  // Provider réel à brancher ici, ex:
  // window.posthog?.capture(name, properties);
}

/** Hook à appeler dans les composants qui veulent tracker un événement
 * comportemental (clic sur un CTA, étape d'un tunnel, etc.).
 *
 * ```tsx
 * const track = useAnalyticsTracking();
 * <button onClick={() => track("premium_cta_clicked", { page: "premium" })}>
 * ```
 */
export function useAnalyticsTracking() {
  return sendEvent;
}

/** Suivi de changement de page, à appeler une fois par navigation (ex: dans
 * un composant monté à la racine du router, cf. App.tsx). */
export function trackPageView(path: string): void {
  sendEvent("page_view", { path });
}
