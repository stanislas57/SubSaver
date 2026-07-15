import { axiosClient } from "@/api/axiosClient";
import type {
  BankCallbackInput,
  BankCallbackResult,
  BankConnectUrl,
  BankProvider,
  BankStatus,
  BankSyncResult,
  BankTransaction,
  BankTransactionsSyncResult,
  DetectedSubscription,
} from "@/types";

export const bankService = {
  /** GET /bank/providers */
  async listProviders(): Promise<BankProvider[]> {
    const { data } = await axiosClient.get<BankProvider[]>("/bank/providers");
    return data;
  },

  /** POST /bank/sync (ancien flow mocké, conservé pour compatibilité) */
  async sync(providerId: string): Promise<BankSyncResult> {
    const { data } = await axiosClient.post<BankSyncResult>("/bank/sync", { provider_id: providerId });
    return data;
  },

  /** GET /bank/connect-url - récupère l'URL de la Webview Powens à ouvrir. */
  async getConnectUrl(): Promise<BankConnectUrl> {
    const { data } = await axiosClient.get<BankConnectUrl>("/bank/connect-url");
    return data;
  },

  /** POST /bank/callback - à appeler avec les query params reçus au retour de la Webview. */
  async handleCallback(input: BankCallbackInput): Promise<BankCallbackResult> {
    const { data } = await axiosClient.post<BankCallbackResult>("/bank/callback", input);
    return data;
  },

  /** POST /bank/transactions/sync - récupère les transactions brutes depuis Powens. */
  async syncTransactions(): Promise<BankTransactionsSyncResult> {
    const { data } = await axiosClient.post<BankTransactionsSyncResult>("/bank/transactions/sync");
    return data;
  },

  /** GET /bank/subscriptions/detect - lance l'algorithme de détection sur les transactions stockées. */
  async detectSubscriptions(): Promise<DetectedSubscription[]> {
    const { data } = await axiosClient.get<DetectedSubscription[]>("/bank/subscriptions/detect");
    return data;
  },

  /** GET /bank/transactions - transactions brutes stockées de l'utilisateur.
   * Matière première de la détection de revenu (cf. lib/detectSalary.ts). */
  async listTransactions(): Promise<BankTransaction[]> {
    const { data } = await axiosClient.get<BankTransaction[]>("/bank/transactions");
    return data;
  },

  /** GET /bank/status - établissement, dernière synchro, nombre de transactions. */
  async getStatus(): Promise<BankStatus> {
    const { data } = await axiosClient.get<BankStatus>("/bank/status");
    return data;
  },
};
