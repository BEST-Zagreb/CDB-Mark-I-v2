"use client";

import { useState } from "react";
import {
  useCollaborationsByCompany,
  useCollaborationsByProject,
  useCreateCollaboration,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/collaborations/use-collaborations";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

export function useCollaborationsOperations(
  type: "company" | "project",
  id: number
) {
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [editingCollaboration, setEditingCollaboration] = useState<
    Collaboration | undefined
  >();

  // React Query hooks - always call both but use based on type
  const companyCollaborations = useCollaborationsByCompany(
    type === "company" ? id : 0
  );
  const projectCollaborations = useCollaborationsByProject(
    type === "project" ? id : 0
  );

  // Use the appropriate data based on type
  const { data: collaborations = [], isLoading: isLoadingCollaborations } =
    type === "company" ? companyCollaborations : projectCollaborations;

  // Mutation hooks
  const createCollaborationMutation = useCreateCollaboration();
  const updateCollaborationMutation = useUpdateCollaboration();
  const deleteCollaborationMutation = useDeleteCollaboration();

  const handleAddCollaboration = () => {
    setEditingCollaboration(undefined);
    setCollaborationDialogOpen(true);
  };

  const handleEditCollaboration = (collaboration: Collaboration) => {
    setEditingCollaboration(collaboration);
    setCollaborationDialogOpen(true);
  };

  const handleDeleteCollaboration = async (collaborationId: number) => {
    await deleteCollaborationMutation.mutateAsync(collaborationId);
  };

  const handleSubmitCollaboration = async (data: CollaborationFormData) => {
    const collaborationData =
      type === "company"
        ? { ...data, companyId: data.companyId || id }
        : { ...data, projectId: id };

    if (editingCollaboration) {
      await updateCollaborationMutation.mutateAsync({
        id: editingCollaboration.id,
        data: collaborationData,
      });
    } else {
      await createCollaborationMutation.mutateAsync(collaborationData);
    }
    setCollaborationDialogOpen(false);
  };

  const isSubmitting =
    createCollaborationMutation.isPending ||
    updateCollaborationMutation.isPending ||
    deleteCollaborationMutation.isPending;

  return {
    collaborations,
    isLoadingCollaborations,
    collaborationDialogOpen,
    setCollaborationDialogOpen,
    editingCollaboration,
    handleAddCollaboration,
    handleEditCollaboration,
    handleDeleteCollaboration,
    handleSubmitCollaboration,
    isSubmitting,
  };
}
