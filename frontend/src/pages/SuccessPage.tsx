import { Navigate, useLocation } from "react-router-dom";

/** /success n'est qu'une cible de redirection pratique pour Stripe (certains
 * dashboards attendent une URL "de remerciement" dédiée). Le pop-up de
 * bienvenue et la confirmation de l'upgrade sont gérés de façon centralisée
 * par PremiumWelcomeGate (monté dans AppLayout, donc actif sur /premium) --
 * on se contente ici de renvoyer vers /premium en conservant la query string
 * (`?success=true`) pour que le pop-up se déclenche bien à l'arrivée. */
export function SuccessPage() {
  const location = useLocation();
  return <Navigate to={`/premium${location.search}`} replace />;
}
