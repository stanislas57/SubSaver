import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bankService } from "@/services/bankService";

export function useBankProviders() {
  return useQuery({ queryKey: ["bank", "providers"], queryFn: bankService.listProviders });
}

export function useBankSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => bankService.sync(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
