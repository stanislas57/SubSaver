import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bankService } from "@/services";
import { getErrorMessage } from "@/api/axiosClient";

export function useBankProviders() {
  return useQuery({
    queryKey: ["bank", "providers"],
    queryFn: bankService.listProviders,
  });
}

export function useBankSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerId: string) => bankService.sync(providerId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(`${result.injected_subscriptions.length} abonnement(s) importé(s) de ta banque`);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Échec de la synchronisation bancaire.")),
  });
}
