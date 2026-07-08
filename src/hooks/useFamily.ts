import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { familyService } from "@/services";
import { getErrorMessage } from "@/api/axiosClient";

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
      queryClient.invalidateQueries({ queryKey: ["family"] });
      toast.success("Membre ajouté");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible d'ajouter ce membre.")),
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => familyService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["family"] });
      toast.success("Membre retiré");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible de retirer ce membre.")),
  });
}
