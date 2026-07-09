import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageSpinner } from "@/components/ui/spinner";
import { CharterGate } from "@/components/shared/CharterGate";
import { PremiumUpsellScreen } from "@/components/shared/PremiumUpsellScreen";

/** Racine de toutes les routes authentifiées (AppLayout + /success). On monte
 * CharterGate ici plutôt que dans AppLayout : /success (retour Stripe) est
 * une route sœur d'AppLayout, pas un enfant -- la placer à ce niveau garantit
 * que la modale bloquante d'acceptation de la charte couvre bien "toute page
 * du site", conformément à la consigne, et pas seulement les pages avec navbar. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageSpinner label="Vérification de la session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <>
      <CharterGate />
      <Outlet />
    </>
  );
}

export function GuestOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageSpinner label="Chargement…" />;
  if (isAuthenticated) return <Navigate to="/overview" replace />;

  return <Outlet />;
}

/** Route protégée pour les fonctionnalités Premium (BtoB, Extraction Comptable, etc).
 * Affiche un paywall contextuel (PremiumUpsellScreen) plutôt que de rediriger
 * instantanément et silencieusement vers Stripe -- l'utilisateur voit ce qu'il
 * débloquerait avant de décider d'y aller, et reste dans l'app tant qu'il n'a
 * pas cliqué explicitement "Passer Premium". */
export function PremiumOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageSpinner label="Vérification de l'accès…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_premium) return <PremiumUpsellScreen />;

  return <Outlet />;
}
