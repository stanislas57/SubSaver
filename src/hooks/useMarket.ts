import { useQuery } from "@tanstack/react-query";
import { marketService } from "@/services";

export function useMarketOffers(category?: string) {
  return useQuery({
    queryKey: ["market", "offers", category ?? "all"],
    queryFn: () => marketService.listOffers(category),
  });
}
