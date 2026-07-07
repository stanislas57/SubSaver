import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageSpinner } from "@/components/ui/spinner";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** Garde d'accès du Back-Office Super Admin (/admin/**).
 *
 * Vérification purement côté UX : chaque endpoint /admin/* du backend
 * revérifie indépendamment `is_admin` (cf. get_current_admin_user dans
 * app/api/deps.py) et renvoie 403 sinon -- ce garde ne fait qu'éviter
 * d'afficher l'interface d'administration à qui n'a pas le rôle, jamais la
 * seule protection réelle des données.
 *
 * - Non connecté -> /login (rien à cacher, l'utilisateur doit s'identifier).
 * - Connecté mais non-admin -> 404 (ne confirme pas l'existence de la zone
 *   admin à un utilisateur standard, plutôt qu'un 403 qui la révélerait). */
export function AdminRouteGuard() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageSpinner label="Vérification des droits…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <NotFoundPage />;

  return <Outlet />;
}
