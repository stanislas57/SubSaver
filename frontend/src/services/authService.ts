import { axiosClient } from "@/api/axiosClient";
import type { AuthResponse, MessageResult } from "@/types";

/** Timeout dédié à l'inscription, aligné sur celui du login : la création de
 * compte peut être la toute première requête envoyée à un hébergeur en cold
 * start, tout comme un login. */
const REGISTER_TIMEOUT_MS = 45_000;

/** Timeout dédié au login, plus généreux que le timeout global (20s) : un
 * hébergeur en cold start (ex: instance gratuite endormie après inactivité)
 * peut mettre jusqu'à 40-50s à répondre à la toute première requête sans que
 * ce soit pour autant un dysfonctionnement -- couper trop tôt ferait échouer
 * un login qui aurait fini par réussir. Le feedback progressif côté UI
 * (LoginForm) prévient l'utilisateur que c'est normal au-delà de quelques
 * secondes plutôt que de le laisser face à un spinner muet. */
const LOGIN_TIMEOUT_MS = 45_000;

export const authService = {
  /** POST /auth/register - le compte est actif immédiatement, aucune vérification
   * requise, et le backend renvoie directement un token (comme /auth/login) pour
   * permettre une connexion automatique juste après l'inscription. */
  async register(email: string, password: string, firstName: string): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>(
      "/auth/register",
      { email, password, first_name: firstName },
      { timeout: REGISTER_TIMEOUT_MS }
    );
    return data;
  },

  /** POST /auth/login - contrat OAuth2PasswordRequestForm (x-www-form-urlencoded). */
  async login(email: string, password: string): Promise<AuthResponse> {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    const { data } = await axiosClient.post<AuthResponse>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: LOGIN_TIMEOUT_MS,
    });
    return data;
  },

  /** POST /auth/google - flux "ID token" : le credential vient de Google
   * Identity Services (déjà signé par Google), ce backend le revérifie
   * lui-même avant de faire confiance à quoi que ce soit qu'il contient. */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>(
      "/auth/google",
      { id_token: idToken },
      { timeout: LOGIN_TIMEOUT_MS }
    );
    return data;
  },

  /** POST /auth/forgot-password */
  async forgotPassword(email: string): Promise<MessageResult> {
    const { data } = await axiosClient.post<MessageResult>("/auth/forgot-password", { email });
    return data;
  },

  /** POST /auth/reset-password */
  async resetPassword(email: string, code: string, newPassword: string): Promise<MessageResult> {
    const { data } = await axiosClient.post<MessageResult>("/auth/reset-password", {
      email,
      code,
      new_password: newPassword,
    });
    return data;
  },
};
