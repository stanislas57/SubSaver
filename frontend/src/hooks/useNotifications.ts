import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";

const KEY = ["notifications"];

// 5 min : assez réactif pour qu'une alerte créée par le job quotidien
// apparaisse sans recharger la page, sans bombarder l'API à chaque render
// (le centre de notifications est monté en permanence dans TopNavbar).
const REFETCH_INTERVAL_MS = 5 * 60 * 1000;

export function useNotifications() {
  return useQuery({ queryKey: KEY, queryFn: notificationService.list, refetchInterval: REFETCH_INTERVAL_MS });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.dismiss(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
