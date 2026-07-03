import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyService } from "@/services/familyService";

export function useFamilyGroup() {
  return useQuery({ queryKey: ["family", "group"], queryFn: familyService.getGroup });
}

export function useFamilyBalances() {
  return useQuery({ queryKey: ["family", "balances"], queryFn: familyService.getBalances });
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, email }: { name: string; email?: string }) => familyService.addMember(name, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family", "group"] });
      queryClient.invalidateQueries({ queryKey: ["family", "balances"] });
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => familyService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family", "group"] });
      queryClient.invalidateQueries({ queryKey: ["family", "balances"] });
    },
  });
}
