"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { CollaborationList } from "@/components/collaborations/collaboration-list";
import { CollaborationDialog } from "@/components/collaborations/collaboration-dialog";
import { projectService } from "@/services/project.service";
import { collaborationService } from "@/services/collaboration.service";
import { Project, ProjectFormData } from "@/types/project";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  const [project, setProject] = useState<Project | null>(null);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCollaborations, setLoadingCollaborations] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [editingCollaboration, setEditingCollaboration] =
    useState<Collaboration | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNaN(projectId)) {
      toast.error("Invalid project ID");
      router.push("/projects");
      return;
    }

    loadProject();
    loadCollaborations();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectService.getById(projectId);
      setProject(data);
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project");
      router.push("/projects");
    } finally {
      setLoading(false);
    }
  };

  const loadCollaborations = async () => {
    try {
      setLoadingCollaborations(true);
      const data = await collaborationService.getByProject(projectId);
      setCollaborations(data);
    } catch (error) {
      console.error("Error loading collaborations:", error);
      toast.error("Failed to load collaborations");
    } finally {
      setLoadingCollaborations(false);
    }
  };

  const handleEditProject = () => {
    setEditDialogOpen(true);
  };

  const handleSubmitProject = async (data: ProjectFormData) => {
    if (!project) return;

    try {
      setSubmitting(true);
      const updatedProject = await projectService.update(project.id, data);
      setProject(updatedProject);
      toast.success("Project updated successfully");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCollaboration = () => {
    setEditingCollaboration(null);
    setCollaborationDialogOpen(true);
  };

  const handleEditCollaboration = (collaboration: Collaboration) => {
    setEditingCollaboration(collaboration);
    setCollaborationDialogOpen(true);
  };

  const handleSubmitCollaboration = async (data: CollaborationFormData) => {
    try {
      setSubmitting(true);
      if (editingCollaboration) {
        const updated = await collaborationService.update(
          editingCollaboration.id,
          data
        );
        setCollaborations((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        toast.success("Collaboration updated successfully");
      } else {
        const created = await collaborationService.create(data);
        setCollaborations((prev) => [created, ...prev]);
        toast.success("Collaboration created successfully");
      }
    } catch (error) {
      console.error("Error saving collaboration:", error);
      toast.error("Failed to save collaboration");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCollaboration = async (collaborationId: number) => {
    try {
      await collaborationService.delete(collaborationId);
      setCollaborations((prev) => prev.filter((c) => c.id !== collaborationId));
      toast.success("Collaboration deleted successfully");
    } catch (error) {
      console.error("Error deleting collaboration:", error);
      toast.error("Failed to delete collaboration");
      throw error;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";

    let dateObj: Date;
    if (typeof date === "string") {
      if (date === "null" || date === "") return "—";
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return "—";

    return new Intl.DateTimeFormat("hr-HR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          Loading project...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/projects")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <p className="text-muted-foreground">Project Details</p>
          </div>
          <Button onClick={handleEditProject}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Project Name
                </label>
                <p className="mt-1 font-medium">{project.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Project ID
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  #{project.id}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <p className="mt-1">{formatDate(project.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="mt-1">{formatDate(project.updated_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collaborations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Collaborations</CardTitle>
                <CardDescription>
                  Companies and organizations involved in this project
                </CardDescription>
              </div>
              <Button onClick={handleAddCollaboration}>
                <Plus className="mr-2 h-4 w-4" />
                Add Collaboration
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CollaborationList
              collaborations={collaborations}
              onEdit={handleEditCollaboration}
              onDelete={handleDeleteCollaboration}
              isLoading={loadingCollaborations}
            />
          </CardContent>
        </Card>
      </div>

      <ProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
        onSubmit={handleSubmitProject}
        isLoading={submitting}
      />

      <CollaborationDialog
        open={collaborationDialogOpen}
        onOpenChange={setCollaborationDialogOpen}
        collaboration={editingCollaboration}
        projectId={projectId}
        onSubmit={handleSubmitCollaboration}
        isLoading={submitting}
      />
    </div>
  );
}
