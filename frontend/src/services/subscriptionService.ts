import { axiosClient } from "@/api/axiosClient";
import type { CancellableSubscription, Subscription, SubscriptionInput } from "@/types";

export const subscriptionService = {
  /** GET /subscriptions */
  async list(): Promise<Subscription[]> {
    const { data } = await axiosClient.get<Subscription[]>("/subscriptions");
    return data;
  },

  /** POST /subscriptions */
  async create(input: SubscriptionInput): Promise<Subscription> {
    const { data } = await axiosClient.post<Subscription>("/subscriptions", input);
    return data;
  },

  /** PUT /subscriptions/{id} */
  async update(id: string, input: SubscriptionInput): Promise<Subscription> {
    const { data } = await axiosClient.put<Subscription>(`/subscriptions/${id}`, input);
    return data;
  },

  /** DELETE /subscriptions/{id} — 204 No Content */
  async remove(id: string): Promise<void> {
    await axiosClient.delete(`/subscriptions/${id}`);
  },

  /** GET /subscriptions/cancellation-candidates */
  async listCancellationCandidates(): Promise<CancellableSubscription[]> {
    const { data } = await axiosClient.get<CancellableSubscription[]>("/subscriptions/cancellation-candidates");
    return data;
  },
};
