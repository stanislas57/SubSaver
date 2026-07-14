import { axiosClient } from "@/api/axiosClient";
import type {
  DebtEdge,
  Settlement,
  SendReminderInput,
  SettleDebtInput,
  ShareableSubscription,
  SharedSubscriptionBalance,
  SharedSubscriptionGroup,
  SharedSubscriptionMember,
  SubscriptionSplit,
  SubscriptionSplitUpdateInput,
} from "@/types";

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

  /** DELETE /family/members/{id} - 204 No Content */
  async removeMember(memberId: string): Promise<void> {
    await axiosClient.delete(`/family/members/${memberId}`);
  },

  /** GET /family/balances */
  async getBalances(): Promise<SharedSubscriptionBalance[]> {
    const { data } = await axiosClient.get<SharedSubscriptionBalance[]>("/family/balances");
    return data;
  },

  /** GET /family/shareable-subscriptions */
  async getShareableSubscriptions(): Promise<ShareableSubscription[]> {
    const { data } = await axiosClient.get<ShareableSubscription[]>("/family/shareable-subscriptions");
    return data;
  },

  /** PUT /family/shared-subscriptions - remplace toute la sélection. */
  async setSharedSubscriptions(subscriptionIds: string[]): Promise<ShareableSubscription[]> {
    const { data } = await axiosClient.put<ShareableSubscription[]>("/family/shared-subscriptions", {
      subscription_ids: subscriptionIds,
    });
    return data;
  },

  /** GET /family/subscriptions/{id}/split */
  async getSubscriptionSplit(subscriptionId: string): Promise<SubscriptionSplit> {
    const { data } = await axiosClient.get<SubscriptionSplit>(`/family/subscriptions/${subscriptionId}/split`);
    return data;
  },

  /** PUT /family/subscriptions/{id}/split */
  async setSubscriptionSplit(subscriptionId: string, input: SubscriptionSplitUpdateInput): Promise<SubscriptionSplit> {
    const { data } = await axiosClient.put<SubscriptionSplit>(`/family/subscriptions/${subscriptionId}/split`, input);
    return data;
  },

  /** GET /family/debts - déjà simplifié (nombre minimal de transactions). */
  async getDebts(): Promise<DebtEdge[]> {
    const { data } = await axiosClient.get<DebtEdge[]>("/family/debts");
    return data;
  },

  /** POST /family/debts/settle */
  async settleDebt(input: SettleDebtInput): Promise<DebtEdge[]> {
    const { data } = await axiosClient.post<DebtEdge[]>("/family/debts/settle", input);
    return data;
  },

  /** GET /family/settlements */
  async getSettlements(): Promise<Settlement[]> {
    const { data } = await axiosClient.get<Settlement[]>("/family/settlements");
    return data;
  },

  /** POST /family/debts/remind - envoi serveur, limité à 10/heure côté backend. */
  async sendReminder(input: SendReminderInput): Promise<{ message: string }> {
    const { data } = await axiosClient.post<{ message: string }>("/family/debts/remind", input);
    return data;
  },
};
