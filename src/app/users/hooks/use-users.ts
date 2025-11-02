"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { CreateUserData, UpdateUserData } from "@/types/user";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

// Query keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Custom hooks
export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: userService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) => {
      return userService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User created successfully");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      userService.update(id, data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      if (updatedUser?.id) {
        queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
      }
      toast.success("User updated successfully");
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return userService.delete(id);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success("User deleted successfully");

      // If user deleted themselves, sign them out
      if (data.deletedSelf) {
        const { signOut } = await import("@/lib/auth-client");
        await signOut();
        window.location.href = "/";
      }
    },
    onError: (error: unknown) => {
      const message = getErrorMessage(error);
      toast.error(message);
    },
  });
}
