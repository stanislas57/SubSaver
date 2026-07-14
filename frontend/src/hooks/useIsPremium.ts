import { useAuth } from "@/contexts/AuthContext";

/** Statut Premium de l'utilisateur courant -- fin wrapper autour de useAuth()
 * pour donner un point d'accès unique aux composants qui gardent une action
 * (cf. PremiumGate). SubSaver n'a qu'un seul palier payant aujourd'hui
 * (is_premium: boolean sur User) : si d'autres paliers apparaissent plus
 * tard, c'est ce hook qui deviendrait le point d'extension naturel. */
export function useIsPremium(): boolean {
  const { user } = useAuth();
  return !!user?.is_premium;
}
