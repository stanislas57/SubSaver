import { useQuery } from "@tanstack/react-query";
import { marketService } from "@/services/marketService";

export function useMarketOffers(category?: string) {
  return useQuery({
    queryKey: ["market", "offers", category],
    queryFn: () => marketService.listOffers(category),
  });
}
