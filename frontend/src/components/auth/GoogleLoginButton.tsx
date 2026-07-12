import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

/** Bouton officiel Google (branding imposé par Google, jamais restylé) --
 * partagé entre LoginForm et RegisterForm puisque le flux est unifié :
 * une première connexion Google crée le compte, les suivantes reconnectent
 * le même. `useOneTap` reste désactivé pour l'instant afin de ne jamais
 * surprendre un visiteur avec une popup automatique à chaque chargement de
 * page -- à reconsidérer plus tard si besoin. */
export function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      toast.error("Connexion Google incomplète. Réessaie.");
      return;
    }
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate("/overview");
    } catch {
      toast.error("Connexion Google impossible. Réessaie.");
    }
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error("Connexion Google impossible. Réessaie.")}
        useOneTap={false}
        width="320"
      />
    </div>
  );
}
