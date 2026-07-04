import { axiosClient } from "@/api/axiosClient";
import type { BankProvider, BankSyncResult } from "@/types";

export const bankService = {
  /** GET /bank/providers */
  async listProviders(): Promise<BankProvider[]> {
    const { data } = await axiosClient.get<BankProvider[]>("/bank/providers");
    return data;
  },

  /** POST /bank/sync */
  async sync(providerId: string): Promise<BankSyncResult> {
    const { data } = await axiosClient.post<BankSyncResult>("/bank/sync", { provider_id: providerId });
    return data;
  },
};
