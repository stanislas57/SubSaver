import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sharedSubscriptionService } from "@/services/sharedSubscriptionService";

const QUERY_KEY = "shared-subscription";

export function useSharedSubscriptionGroup() {
  return useQuery({ queryKey: [QUERY_KEY, "group"], queryFn: sharedSubscriptionService.getGroup });
}

export function useSharedSubscriptionBalances() {
  return useQuery({ queryKey: [QUERY_KEY, "balances"], queryFn: sharedSubscriptionService.getBalances });
}

export function useAddSharedSubscriptionMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, email }: { name: string; email?: string }) =>
      sharedSubscriptionService.addMember(name, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "group"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "balances"] });
    },
  });
}

export function useRemoveSharedSubscriptionMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => sharedSubscriptionService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "group"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "balances"] });
    },
  });
}
