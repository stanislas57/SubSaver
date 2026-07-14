import { axiosClient } from "@/api/axiosClient";
import type { BankFeeReport, VatRecoveryReport } from "@/types";

export const proService = {
  /** GET /pro/vat-recovery */
  async getVatRecoveryReport(): Promise<VatRecoveryReport> {
    const { data } = await axiosClient.get<VatRecoveryReport>("/pro/vat-recovery");
    return data;
  },

  /** GET /pro/bank-fees */
  async getBankFeesReport(): Promise<BankFeeReport> {
    const { data } = await axiosClient.get<BankFeeReport>("/pro/bank-fees");
    return data;
  },

  /** GET /pro/accounting-export -- réponse CSV brute, téléchargée en blob. */
  async downloadAccountingExport(): Promise<Blob> {
    const { data } = await axiosClient.get<Blob>("/pro/accounting-export", { responseType: "blob" });
    return data;
  },
};
