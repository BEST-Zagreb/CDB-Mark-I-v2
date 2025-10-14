"use client";

import { useState } from "react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/app/users/hooks/use-users";
import { User, UserFormData } from "@/types/user";

export function useUserOperations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();

  // Fetch ALL users at once (no server-side search filtering)
  const { data: users = [], isLoading: isLoadingUsers, error } = useUsers();

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleCreateUser = () => {
    setEditingUser(undefined);
    setDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSubmitUser = async (data: UserFormData) => {
    if (editingUser) {
      // Update existing user
      await updateMutation.mutateAsync({ id: editingUser.id, data });
    } else {
      // Create new user
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteMutation.mutateAsync(userId);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return {
    users,
    isLoadingUsers,
    error,
    dialogOpen,
    setDialogOpen,
    editingUser,
    handleCreateUser,
    handleEditUser,
    handleSubmitUser,
    handleDeleteUser,
    isSubmitting,
  };
}
