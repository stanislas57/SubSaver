import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import type { AdminUserUpdateInput, SubscriptionInput } from "@/types";

const USERS_KEY = ["admin", "users"];
const ANALYTICS_KEY = ["admin", "analytics"];

export function useAdminUsers(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => adminService.listUsers(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUserUpdateInput }) => adminService.updateUser(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useAdminUserSubscriptions(userId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "user-subscriptions", userId],
    queryFn: () => adminService.listUserSubscriptions(userId as string),
    enabled: !!userId,
  });
}

export function useAdminUpdateUserSubscription(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subId, input }: { subId: string; input: SubscriptionInput }) =>
      adminService.updateUserSubscription(userId as string, subId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-subscriptions", userId] });
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useAdminDeleteUserSubscription(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subId: string) => adminService.deleteUserSubscription(userId as string, subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-subscriptions", userId] });
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useAdminAnalytics() {
  return useQuery({ queryKey: ANALYTICS_KEY, queryFn: adminService.getAnalytics });
}
