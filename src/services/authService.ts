import { axiosClient } from "@/api/axiosClient";
import type { AuthResponse, RegisterResponse, VerifyOtpResponse } from "@/types";

export const authService = {
  /** POST /auth/register — envoie l'OTP par SMS. */
  async register(email: string, password: string, firstName: string, phone: string): Promise<RegisterResponse> {
    const { data } = await axiosClient.post<RegisterResponse>("/auth/register", {
      email,
      password,
      first_name: firstName,
      phone,
    });
    return data;
  },

  /** POST /auth/verify-otp — valide le code OTP et retourne le token. */
  async verifyOtp(email: string, phone: string, otpCode: string): Promise<VerifyOtpResponse> {
    const { data } = await axiosClient.post<VerifyOtpResponse>("/auth/verify-otp", {
      email,
      phone,
      otp_code: otpCode,
    });
    return data;
  },

  /** POST /auth/login — contrat OAuth2PasswordRequestForm (x-www-form-urlencoded). */
  async login(email: string, password: string): Promise<AuthResponse> {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    const { data } = await axiosClient.post<AuthResponse>("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return data;
  },
};
