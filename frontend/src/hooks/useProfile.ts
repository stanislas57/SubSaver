import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import type { ProfileUpdatePayload } from "@/types";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => userService.updateProfile(payload),
    onSuccess: (user) => queryClient.setQueryData(["me"], user),
  });
}
