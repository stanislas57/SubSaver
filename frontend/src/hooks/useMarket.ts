import { useQuery } from "@tanstack/react-query";
import { marketService } from "@/services/marketService";

export function useMarketOffers(category?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["market", "offers", category],
    queryFn: () => marketService.listOffers(category),
    enabled: options?.enabled ?? true,
  });
}
