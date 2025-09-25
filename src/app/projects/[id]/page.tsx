"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/common/form-dialog";
import { ProjectForm } from "@/app/projects/components/project-form";
import { CollaborationForm } from "@/components/collaborations/form/collaboration-form";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { useProjectDetailOperations } from "@/app/projects/[id]/hooks/use-project-detail-operations";
import { useCollaborationsOperations } from "@/hooks/collaborations/use-collaborations-operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Project } from "@/types/project";
import { Collaboration } from "@/types/collaboration";
import { ProjectDetailsSection } from "@/app/projects/[id]/components/sections/project-details-section";
import { CollaborationsSection } from "@/components/collaborations/collaborations-section";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const projectId = rawId ? parseInt(rawId) : 0;
  const isMobile = useIsMobile();

  // Custom hooks for operations
  const projectOps = useProjectDetailOperations(projectId);
  const collaborationsOps = useCollaborationsOperations("project", projectId);

  const {
    project,
    isLoadingProject,
    projectError,
    editDialogOpen,
    setEditDialogOpen,
    handleEditProject,
    handleDeleteProject,
    handleSubmitProject,
    isSubmitting: isSubmittingProject,
  } = projectOps;

  const {
    collaborations,
    isLoadingCollaborations,
    collaborationDialogOpen,
    setCollaborationDialogOpen,
    editingCollaboration,
    handleAddCollaboration,
    handleEditCollaboration,
    handleDeleteCollaboration,
    handleSubmitCollaboration,
    isSubmitting: isSubmittingCollaboration,
  } = collaborationsOps;

  useEffect(() => {
    if (isNaN(projectId)) {
      router.push("/projects");
      return;
    }
  }, [projectId, router]);

  // Redirect if project not found
  useEffect(() => {
    if (projectError) {
      router.push("/projects");
    }
  }, [projectError, router]);

  const isSubmitting = isSubmittingProject || isSubmittingCollaboration;

  if (isLoadingProject) {
    return <BlocksWaveLoader size={96} className="my-16" />;
  }

  if (!project) {
    return (
      <div className="mx-auto p-4">
        <div className="text-center py-8 text-muted-foreground">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/projects")}
            >
              <ArrowLeft className="size-5" />
            </Button>

            <h1 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <Button
              onClick={handleEditProject}
              size={isMobile ? "icon" : "default"}
            >
              <Pencil className="size-4" />
              {!isMobile && "Edit Project"}
            </Button>

            <Button
              onClick={() => handleDeleteProject(project)}
              size={isMobile ? "icon" : "default"}
            >
              <Trash2 className="size-4" />
              {!isMobile && " Delete Project"}
            </Button>
          </div>
        </div>

        <ProjectDetailsSection
          project={project}
          collaborations={collaborations}
        />

        <CollaborationsSection
          type="project"
          collaborations={collaborations}
          isLoadingCollaborations={isLoadingCollaborations}
          isMobile={isMobile}
          onAddCollaboration={handleAddCollaboration}
          onEditCollaboration={handleEditCollaboration}
          onDeleteCollaboration={handleDeleteCollaboration}
        />
      </div>

      <FormDialog<Project>
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        entity="Project"
        initialData={project}
        onSubmit={handleSubmitProject}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <ProjectForm
            initialData={formProps.initialData}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>

      <FormDialog<Collaboration>
        open={collaborationDialogOpen}
        onOpenChange={setCollaborationDialogOpen}
        entity="Collaboration"
        initialData={editingCollaboration}
        onSubmit={handleSubmitCollaboration}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <CollaborationForm
            initialData={formProps.initialData}
            projectId={projectId}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </div>
  );
}
