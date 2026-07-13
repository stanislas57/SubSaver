import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { decodeGoogleCredential, type GoogleCredentialPayload } from "@/lib/googleCredential";

interface GoogleLoginButtonProps {
  /** "login" (par défaut) : connecte instantanément via le backend, comme
   * aujourd'hui. "prefill" : ne connecte pas -- décode le token côté client
   * et transmet prénom/email via `onPrefill` pour que l'appelant remplisse
   * son propre formulaire (cas de RegisterForm, où le mot de passe doit
   * rester choisi par l'utilisateur). */
  mode?: "login" | "prefill";
  onPrefill?: (payload: GoogleCredentialPayload) => void;
}

/** Bouton officiel Google (branding imposé par Google, jamais restylé) --
 * partagé entre LoginForm et RegisterForm. En mode "login" (LoginForm), une
 * première connexion Google crée le compte, les suivantes reconnectent le
 * même. `useOneTap` reste désactivé pour l'instant afin de ne jamais
 * surprendre un visiteur avec une popup automatique à chaque chargement de
 * page -- à reconsidérer plus tard si besoin. */
export function GoogleLoginButton({ mode = "login", onPrefill }: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      toast.error("Connexion Google incomplète. Réessaie.");
      return;
    }

    if (mode === "prefill") {
      const payload = decodeGoogleCredential(credentialResponse.credential);
      if (!payload) {
        toast.error("Connexion Google incomplète. Réessaie.");
        return;
      }
      onPrefill?.(payload);
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
