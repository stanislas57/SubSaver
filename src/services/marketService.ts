import { axiosClient } from "@/api/axiosClient";
import type { MarketOffer } from "@/types";

export const marketService = {
  /** GET /market/offers?category=... */
  async listOffers(category?: string): Promise<MarketOffer[]> {
    const { data } = await axiosClient.get<MarketOffer[]>("/market/offers", {
      params: category ? { category } : undefined,
    });
    return data;
  },
};
