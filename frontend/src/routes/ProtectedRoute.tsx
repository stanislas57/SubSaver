import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageSpinner } from "@/components/ui/spinner";
import { STRIPE_BILLING_URL } from "@/api/config";
import { CharterGate } from "@/components/shared/CharterGate";

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
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/** Route protégée pour les fonctionnalités Premium (BtoB, Extraction Comptable, etc).
 * Redirige vers Stripe si l'utilisateur n'est pas Premium. */
export function PremiumOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageSpinner label="Vérification de l'accès…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_premium) {
    // Redirection vers Stripe pour l'achat Premium
    window.location.href = STRIPE_BILLING_URL;
    return null;
  }

  return <Outlet />;
}
