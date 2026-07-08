import { useAuth } from "@/contexts/AuthContext";
import { CharterModal } from "@/components/shared/CharterModal";

/** Bloque l'accès au site tant que l'utilisateur n'a jamais accepté la charte
 * informatique (`user.charter_accepted_at` null côté backend). Ne s'affiche
 * donc qu'une seule fois par compte, dès la toute première connexion -- une
 * fois acceptée, la valeur est persistée en base et ce composant ne rend
 * plus rien à toute connexion future (cf. POST /users/me/accept-charter). */
export function CharterGate() {
  const { user } = useAuth();

  if (!user || user.charter_accepted_at) return null;

  return <CharterModal />;
}
