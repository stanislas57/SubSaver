import { axiosClient } from "@/api/axiosClient";
import type { ProfileUpdatePayload, User } from "@/types";

export const userService = {
  /** GET /users/me */
  async getMe(): Promise<User> {
    const { data } = await axiosClient.get<User>("/users/me");
    return data;
  },

  /** PATCH /users/me */
  async updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    const { data } = await axiosClient.patch<User>("/users/me", payload);
    return data;
  },

  /** POST /users/me/upgrade-premium - appelé au retour de la page de succès Stripe. */
  async upgradeToPremium(): Promise<User> {
    const { data } = await axiosClient.post<User>("/users/me/upgrade-premium");
    return data;
  },

  /** POST /users/me/accept-charter - appelé au clic sur "J'accepte" dans CharterModal. */
  async acceptCharter(): Promise<User> {
    const { data } = await axiosClient.post<User>("/users/me/accept-charter");
    return data;
  },
};
