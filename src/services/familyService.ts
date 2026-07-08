import { axiosClient } from "@/api/axiosClient";
import type { FamilyBalance, FamilyGroup, FamilyMember } from "@/types";

export const familyService = {
  /** GET /family/group */
  async getGroup(): Promise<FamilyGroup> {
    const { data } = await axiosClient.get<FamilyGroup>("/family/group");
    return data;
  },

  /** POST /family/members */
  async addMember(name: string, email?: string): Promise<FamilyMember> {
    const { data } = await axiosClient.post<FamilyMember>("/family/members", {
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
  async getBalances(): Promise<FamilyBalance[]> {
    const { data } = await axiosClient.get<FamilyBalance[]>("/family/balances");
    return data;
  },
};
