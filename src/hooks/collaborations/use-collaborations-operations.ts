"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  useCollaborationsByCompany,
  useCollaborationsByProject,
  useCollaborationsByResponsible,
  useCreateCollaboration,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/collaborations/use-collaborations";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";
import { useUser } from "@/app/users/hooks/use-users";

export function useCollaborationsOperations() {
  const pathname = usePathname();

  // Extract type and id from pathname
  // Format: /companies/:id, /projects/:id, /users/:id
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageType = pathSegments[0] as "companies" | "projects" | "users";
  const pageId = pathSegments[1] as string;

  // Parse id as number for companies/projects, keep as string for users
  const id = pageType !== "users" ? parseInt(pageId) : pageId;

  // Fetch user data if on users page
  const { data: user } = useUser(pageType === "users" ? pageId : "");
  const userName = user?.fullName;

  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [editingCollaboration, setEditingCollaboration] = useState<
    Collaboration | undefined
  >();

  // React Query hooks - call all three but only use the one we need
  const companyQuery = useCollaborationsByCompany(
    pageType === "companies" ? (id as number) : 0
  );
  const projectQuery = useCollaborationsByProject(
    pageType === "projects" ? (id as number) : 0
  );
  const userQuery = useCollaborationsByResponsible(
    pageType === "users" ? userName || "" : ""
  );

  // Use the appropriate data based on type
  const { data: collaborations = [], isLoading: isLoadingCollaborations } =
    pageType === "companies"
      ? companyQuery
      : pageType === "projects"
      ? projectQuery
      : userQuery;

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
    // Prepare collaboration data based on page type
    let collaborationData = { ...data };

    // Only override IDs for companies/projects pages, keep as-is for users page
    if (pageType === "companies") {
      collaborationData = {
        ...data,
        companyId: data.companyId || (id as number),
      };
    } else if (pageType === "projects") {
      collaborationData = { ...data, projectId: id as number };
    }
    // For "users" type, we keep the data as is (companyId and projectId from form)

    if (editingCollaboration) {
      await updateCollaborationMutation.mutateAsync({
        id: editingCollaboration.id,
        data: collaborationData,
      });
    } else if (pageType !== "users") {
      // Only company/project pages can create new collaborations
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
