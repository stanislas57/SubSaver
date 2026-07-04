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
};
