"use client";

import { useState } from "react";
import {
  useCollaborationsByCompany,
  useCreateCollaboration,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/collaborations/use-collaborations";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

export function useCollaborationsOperations(companyId: number) {
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [selectedCollaboration, setSelectedCollaboration] = useState<
    Collaboration | undefined
  >();

  // React Query hooks
  const { data: collaborations = [], isLoading: isLoadingCollaborations } =
    useCollaborationsByCompany(companyId);

  // Mutation hooks
  const createCollaborationMutation = useCreateCollaboration();
  const updateCollaborationMutation = useUpdateCollaboration();
  const deleteCollaborationMutation = useDeleteCollaboration();

  const handleAddCollaboration = () => {
    setSelectedCollaboration(undefined);
    setCollaborationDialogOpen(true);
  };

  const handleEditCollaboration = (collaboration: Collaboration) => {
    setSelectedCollaboration(collaboration);
    setCollaborationDialogOpen(true);
  };

  const handleDeleteCollaboration = async (collaborationId: number) => {
    await deleteCollaborationMutation.mutateAsync(collaborationId);
  };

  const handleSubmitCollaboration = async (data: CollaborationFormData) => {
    const collaborationData = {
      ...data,
      companyId: data.companyId || companyId,
    };

    if (selectedCollaboration) {
      await updateCollaborationMutation.mutateAsync({
        id: selectedCollaboration.id,
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
    selectedCollaboration,
    handleAddCollaboration,
    handleEditCollaboration,
    handleDeleteCollaboration,
    handleSubmitCollaboration,
    isSubmitting,
  };
}
