import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subscriptionService } from "@/services";
import { getErrorMessage } from "@/api/axiosClient";
import type { SubscriptionInput } from "@/types";

const KEY = ["subscriptions"] as const;

export function useSubscriptions() {
  return useQuery({
    queryKey: KEY,
    queryFn: subscriptionService.list,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionInput) => subscriptionService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Abonnement ajouté");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible d'ajouter l'abonnement.")),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubscriptionInput }) =>
      subscriptionService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Abonnement mis à jour");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible de mettre à jour l'abonnement.")),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Abonnement supprimé");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible de supprimer l'abonnement.")),
  });
}

export function useExportSubscriptionsCsv() {
  return useMutation({
    mutationFn: () => subscriptionService.exportCsv(),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Export CSV téléchargé");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible d'exporter le CSV.")),
  });
}
