import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscriptionService";
import { sharedSubscriptionService } from "@/services/sharedSubscriptionService";
import { useAuth } from "@/contexts/AuthContext";
import type { SubscriptionInput } from "@/types";

const KEY = ["subscriptions"];

export function useSubscriptions() {
  return useQuery({ queryKey: KEY, queryFn: subscriptionService.list });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionInput) => subscriptionService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubscriptionInput }) => subscriptionService.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCancellationCandidates() {
  return useQuery({ queryKey: ["subscriptions", "cancellation-candidates"], queryFn: subscriptionService.listCancellationCandidates });
}

/** Export Excel Pro/BtoB : classeur multi-onglets (Résumé, Abonnements,
 * Partage, Règlements) construit entièrement côté client avec ExcelJS, à
 * partir des données déjà exposées par les endpoints existants -- pas de
 * nouvel endpoint backend. Les données de partage sont best-effort : un
 * échec (ex: pas de groupe familial) ne doit pas casser l'export.
 * ExcelJS (~900 Ko) est chargé en dynamic import() : ce hook est utilisé
 * dans quasi toutes les pages de l'app, un import statique aurait alourdi
 * le chunk commun pour tout le monde, y compris ceux qui n'exportent jamais. */
export function useExportSubscriptionsExcel() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Utilisateur non authentifié.");
      const [{ buildSubscriptionsWorkbook }, subscriptions, balances, settlements] = await Promise.all([
        import("@/lib/subscriptionsExcelExport"),
        subscriptionService.list(),
        sharedSubscriptionService.getBalances().catch(() => []),
        sharedSubscriptionService.getSettlements().catch(() => []),
      ]);
      const blob = await buildSubscriptionsWorkbook({ user, subscriptions, balances, settlements });
      const filename = `subsaver-abonnements-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
