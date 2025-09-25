"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useProject,
  useDeleteProject,
  useUpdateProject,
} from "@/hooks/projects/use-projects";
import { Project, ProjectFormData } from "@/types/project";
import { useDeleteAlert } from "@/contexts/delete-alert-context";

export function useProjectDetailOperations(projectId: number) {
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // React Query hooks
  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useProject(projectId);

  // Mutation hooks
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const handleEditProject = () => {
    setEditDialogOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    showDeleteAlert({
      entity: "project",
      entityName: project.name,
      onConfirm: () => deleteProjectMutation.mutate(project.id),
    });
  };

  const handleSubmitProject = async (data: ProjectFormData) => {
    if (!project) return;
    await updateProjectMutation.mutateAsync({ id: project.id, data });
    setEditDialogOpen(false);
  };

  const isSubmitting = updateProjectMutation.isPending;

  return {
    project,
    isLoadingProject,
    projectError,
    editDialogOpen,
    setEditDialogOpen,
    handleEditProject,
    handleDeleteProject,
    handleSubmitProject,
    isSubmitting,
  };
}
