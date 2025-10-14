"use client";

import { useState } from "react";
import {
  useUser,
  useDeleteUser,
  useUpdateUser,
} from "@/app/users/hooks/use-users";
import { User, UserFormData } from "@/types/user";
import { useDeleteAlert } from "@/contexts/delete-alert-context";

export function useUserDetailOperations(userId: string) {
  const { showDeleteAlert } = useDeleteAlert();

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // React Query hooks
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useUser(userId);

  // Mutation hooks
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const handleEditUser = () => {
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    showDeleteAlert({
      entityType: "user",
      entityDescription: `user "${user.fullName}"`,
      onConfirm: () => deleteUserMutation.mutate(user.id),
    });
  };

  const handleSubmitUser = async (data: UserFormData) => {
    if (!user) return;
    await updateUserMutation.mutateAsync({ id: user.id, data });
    setEditDialogOpen(false);
  };

  const isSubmitting = updateUserMutation.isPending;

  return {
    user,
    isLoadingUser,
    userError,
    editDialogOpen,
    setEditDialogOpen,
    handleEditUser,
    handleDeleteUser,
    handleSubmitUser,
    isSubmitting,
  };
}
