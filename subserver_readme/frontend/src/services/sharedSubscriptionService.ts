import { axiosClient } from "@/api/axiosClient";
import type { SharedSubscriptionBalance, SharedSubscriptionGroup, SharedSubscriptionMember } from "@/types";

export const sharedSubscriptionService = {
  /** GET /family/group (route backend inchangée) */
  async getGroup(): Promise<SharedSubscriptionGroup> {
    const { data } = await axiosClient.get<SharedSubscriptionGroup>("/family/group");
    return data;
  },

  /** POST /family/members */
  async addMember(name: string, email?: string): Promise<SharedSubscriptionMember> {
    const { data } = await axiosClient.post<SharedSubscriptionMember>("/family/members", {
      name,
      email: email ?? null,
    });
    return data;
  },

  /** DELETE /family/members/{id} — 204 No Content */
  async removeMember(memberId: string): Promise<void> {
    await axiosClient.delete(`/family/members/${memberId}`);
  },

  /** GET /family/balances */
  async getBalances(): Promise<SharedSubscriptionBalance[]> {
    const { data } = await axiosClient.get<SharedSubscriptionBalance[]>("/family/balances");
    return data;
  },
};
