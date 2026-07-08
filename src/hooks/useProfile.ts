import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userService } from "@/services";
import { getErrorMessage } from "@/api/axiosClient";
import type { ProfileUpdatePayload } from "@/types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => userService.updateProfile(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      toast.success("Profil mis à jour");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible de mettre à jour le profil.")),
  });
}
