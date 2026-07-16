import { axiosClient } from "@/api/axiosClient";
import type { RenewalAlert } from "@/types";

export const notificationService = {
  /** GET /notifications */
  async list(): Promise<RenewalAlert[]> {
    const { data } = await axiosClient.get<RenewalAlert[]>("/notifications");
    return data;
  },

  /** POST /notifications/{id}/read */
  async markRead(id: string): Promise<RenewalAlert> {
    const { data } = await axiosClient.post<RenewalAlert>(`/notifications/${id}/read`);
    return data;
  },

  /** POST /notifications/{id}/dismiss */
  async dismiss(id: string): Promise<RenewalAlert> {
    const { data } = await axiosClient.post<RenewalAlert>(`/notifications/${id}/dismiss`);
    return data;
  },
};
