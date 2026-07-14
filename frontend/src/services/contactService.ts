import { axiosClient } from "@/api/axiosClient";
import type { ContactFormPayload, MessageResult } from "@/types";

export const contactService = {
  /** POST /contact - public, aucune authentification requise. */
  async send(payload: ContactFormPayload): Promise<MessageResult> {
    const { data } = await axiosClient.post<MessageResult>("/contact", payload);
    return data;
  },
};
