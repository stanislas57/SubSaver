import { axiosClient } from "@/api/axiosClient";
import type {
  AdminAnalytics,
  AdminUser,
  AdminUsersPage,
  AdminUserUpdateInput,
  Subscription,
  SubscriptionInput,
} from "@/types";

export const adminService = {
  /** GET /admin/users */
  async listUsers(params: { q?: string; page?: number; pageSize?: number }): Promise<AdminUsersPage> {
    const { data } = await axiosClient.get<AdminUsersPage>("/admin/users", {
      params: { q: params.q || undefined, page: params.page ?? 1, page_size: params.pageSize ?? 20 },
    });
    return data;
  },

  /** PATCH /admin/users/{id} */
  async updateUser(id: string, input: AdminUserUpdateInput): Promise<AdminUser> {
    const { data } = await axiosClient.patch<AdminUser>(`/admin/users/${id}`, input);
    return data;
  },

  /** GET /admin/users/{id}/subscriptions */
  async listUserSubscriptions(userId: string): Promise<Subscription[]> {
    const { data } = await axiosClient.get<Subscription[]>(`/admin/users/${userId}/subscriptions`);
    return data;
  },

  /** PUT /admin/users/{id}/subscriptions/{subId} */
  async updateUserSubscription(userId: string, subId: string, input: SubscriptionInput): Promise<Subscription> {
    const { data } = await axiosClient.put<Subscription>(`/admin/users/${userId}/subscriptions/${subId}`, input);
    return data;
  },

  /** DELETE /admin/users/{id}/subscriptions/{subId} */
  async deleteUserSubscription(userId: string, subId: string): Promise<void> {
    await axiosClient.delete(`/admin/users/${userId}/subscriptions/${subId}`);
  },

  /** GET /admin/analytics */
  async getAnalytics(): Promise<AdminAnalytics> {
    const { data } = await axiosClient.get<AdminAnalytics>("/admin/analytics");
    return data;
  },
};
