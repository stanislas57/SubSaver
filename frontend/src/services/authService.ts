import { axiosClient } from "@/api/axiosClient";
import type { AuthResponse } from "@/types";

export const authService = {
  /** POST /auth/register */
  async register(email: string, password: string, firstName: string): Promise<AuthResponse> {
    const { data } = await axiosClient.post<AuthResponse>("/auth/register", {
      email,
      password,
      first_name: firstName,
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
