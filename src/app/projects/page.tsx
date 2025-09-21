"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectList, ProjectDialog } from "@/components/projects";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { Project, ProjectFormData } from "@/types/project";

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  // React Query hooks
  const { data: projects = [], isLoading: loading } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  function handleCreateProject() {
    setEditingProject(undefined);
    setDialogOpen(true);
  }

  function handleEditProject(project: Project) {
    setEditingProject(project);
    setDialogOpen(true);
  }

  async function handleSubmitProject(data: ProjectFormData) {
    if (editingProject) {
      // Update existing project
      await updateMutation.mutateAsync({ id: editingProject.id, data });
    } else {
      // Create new project
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
  }

  async function handleDeleteProject(projectId: number) {
    await deleteMutation.mutateAsync(projectId);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your project database
            </p>
          </div>
          <Button onClick={handleCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading projects...
          </div>
        ) : (
          <ProjectList
            projects={projects}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSubmit={handleSubmitProject}
        isLoading={isSubmitting}
      />
    </div>
  );
}
