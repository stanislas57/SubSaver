import { axiosClient } from "@/api/axiosClient";
import type { AuthResponse, MessageResult, RegisterResult } from "@/types";

/** Timeout dédié au login, plus généreux que le timeout global (20s) : un
 * hébergeur en cold start (ex: instance gratuite endormie après inactivité)
 * peut mettre jusqu'à 40-50s à répondre à la toute première requête sans que
 * ce soit pour autant un dysfonctionnement -- couper trop tôt ferait échouer
 * un login qui aurait fini par réussir. Le feedback progressif côté UI
 * (LoginForm) prévient l'utilisateur que c'est normal au-delà de quelques
 * secondes plutôt que de le laisser face à un spinner muet. */
const LOGIN_TIMEOUT_MS = 45_000;

export const authService = {
  /** POST /auth/register — le compte n'est pas actif tant que /auth/verify-email n'a pas été appelé. */
  async register(email: string, password: string, firstName: string): Promise<RegisterResult> {
    const { data } = await axiosClient.post<RegisterResult>("/auth/register", {
      email,
      password,
      first_name: firstName,
    });
    return data;
  },

  /** POST /auth/verify-email — valide le code à 6 chiffres et connecte l'utilisateur. */
  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>("/auth/verify-email", { email, code });
    return data;
  },

  /** POST /auth/resend-code */
  async resendCode(email: string): Promise<MessageResult> {
    const { data } = await axiosClient.post<MessageResult>("/auth/resend-code", { email });
    return data;
  },

  /** POST /auth/login — contrat OAuth2PasswordRequestForm (x-www-form-urlencoded). */
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
