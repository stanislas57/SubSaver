import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sharedSubscriptionService } from "@/services/sharedSubscriptionService";
import type { SendReminderInput, SettleDebtInput, SubscriptionSplitUpdateInput } from "@/types";

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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "debts"] });
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
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "debts"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "settlements"] });
    },
  });
}

export function useShareableSubscriptions() {
  return useQuery({
    queryKey: [QUERY_KEY, "shareable-subscriptions"],
    queryFn: sharedSubscriptionService.getShareableSubscriptions,
  });
}

export function useSetSharedSubscriptions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionIds: string[]) => sharedSubscriptionService.setSharedSubscriptions(subscriptionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "shareable-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "balances"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "debts"] });
    },
  });
}

export function useSubscriptionSplit(subscriptionId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, "split", subscriptionId],
    queryFn: () => sharedSubscriptionService.getSubscriptionSplit(subscriptionId as string),
    enabled: !!subscriptionId,
  });
}

export function useSetSubscriptionSplit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subscriptionId, input }: { subscriptionId: string; input: SubscriptionSplitUpdateInput }) =>
      sharedSubscriptionService.setSubscriptionSplit(subscriptionId, input),
    onSuccess: (_data, { subscriptionId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "split", subscriptionId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "balances"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "debts"] });
    },
  });
}

export function useDebts() {
  return useQuery({ queryKey: [QUERY_KEY, "debts"], queryFn: sharedSubscriptionService.getDebts });
}

export function useSettleDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SettleDebtInput) => sharedSubscriptionService.settleDebt(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "debts"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "settlements"] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "balances"] });
    },
  });
}

export function useSettlements() {
  return useQuery({ queryKey: [QUERY_KEY, "settlements"], queryFn: sharedSubscriptionService.getSettlements });
}

export function useSendDebtReminder() {
  return useMutation({
    mutationFn: (input: SendReminderInput) => sharedSubscriptionService.sendReminder(input),
  });
}
