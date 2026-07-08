import { axiosClient } from "@/api/axiosClient";
import type { Subscription, SubscriptionInput } from "@/types";

/** Extrait le nom de fichier depuis l'en-tête Content-Disposition, avec repli. */
function filenameFromContentDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^"; ]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
}

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

  /** GET /subscriptions/export — StreamingResponse text/csv */
  async exportCsv(): Promise<{ blob: Blob; filename: string }> {
    const response = await axiosClient.get("/subscriptions/export", { responseType: "blob" });
    const filename = filenameFromContentDisposition(
      response.headers["content-disposition"],
      "subserver-abonnements.csv"
    );
    return { blob: response.data as Blob, filename };
  },
};
