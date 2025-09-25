"use client";

import { useState } from "react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/app/projects/hooks/use-projects";
import { Project, ProjectFormData } from "@/types/project";

export function useProjectOperations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  // Fetch ALL projects at once (no server-side search filtering)
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error,
  } = useProjects();

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const handleCreateProject = () => {
    setEditingProject(undefined);
    setDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleSubmitProject = async (data: ProjectFormData) => {
    if (editingProject) {
      // Update existing project
      await updateMutation.mutateAsync({ id: editingProject.id, data });
    } else {
      // Create new project
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteProject = async (projectId: number) => {
    await deleteMutation.mutateAsync(projectId);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return {
    projects,
    isLoadingProjects,
    error,
    dialogOpen,
    setDialogOpen,
    editingProject,
    handleCreateProject,
    handleEditProject,
    handleSubmitProject,
    handleDeleteProject,
    isSubmitting,
  };
}
