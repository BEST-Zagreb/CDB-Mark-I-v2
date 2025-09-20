"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import {
  useCollaborationsByProject,
  useCreateCollaboration,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/useCollaborations";
import { Project, ProjectFormData } from "@/types/project";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [editingCollaboration, setEditingCollaboration] =
    useState<Collaboration | null>(null);

  // React Query hooks
  const {
    data: project,
    isLoading: loading,
    error: projectError,
  } = useProject(projectId);
  const { data: collaborations = [], isLoading: loadingCollaborations } =
    useCollaborationsByProject(projectId);

  // Mutation hooks
  const updateProjectMutation = useUpdateProject();
  const createCollaborationMutation = useCreateCollaboration();
  const updateCollaborationMutation = useUpdateCollaboration();
  const deleteCollaborationMutation = useDeleteCollaboration();

  // Calculate fundraising progress
  const calculateFundraisingProgress = () => {
    if (!project?.frGoal || !collaborations.length) {
      return { totalRaised: 0, progressPercentage: 0 };
    }

    // Sum up amounts from successful collaborations only
    const totalRaised = collaborations
      .filter(
        (collaboration) => collaboration.successful && collaboration.amount
      )
      .reduce((sum, collaboration) => sum + (collaboration.amount || 0), 0);

    const progressPercentage = Math.min(
      (totalRaised / project.frGoal) * 100,
      100
    );

    return { totalRaised, progressPercentage };
  };

  const { totalRaised, progressPercentage } = calculateFundraisingProgress();

  useEffect(() => {
    if (isNaN(projectId)) {
      toast.error("Invalid project ID");
      router.push("/projects");
      return;
    }
  }, [projectId, router]);

  // Redirect if project not found
  useEffect(() => {
    if (projectError) {
      toast.error("Failed to load project");
      router.push("/projects");
    }
  }, [projectError, router]);

  const handleEditProject = () => {
    setEditDialogOpen(true);
  };

  const handleSubmitProject = async (data: ProjectFormData) => {
    if (!project) return;
    await updateProjectMutation.mutateAsync({ id: project.id, data });
    setEditDialogOpen(false);
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
    const collaborationData = { ...data, projectId };

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

  const handleDeleteCollaboration = async (collaborationId: number) => {
    await deleteCollaborationMutation.mutateAsync(collaborationId);
  };

  const isSubmitting =
    updateProjectMutation.isPending ||
    createCollaborationMutation.isPending ||
    updateCollaborationMutation.isPending ||
    deleteCollaborationMutation.isPending;

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
                  Fundraising Goal
                </label>
                <p className="mt-1 font-medium">
                  {project.frGoal &&
                  new Date(project.updated_at || new Date()) <
                    new Date("2023-01-01")
                    ? new Intl.NumberFormat("hr-HR", {
                        style: "currency",
                        currency: "HRK",
                      }).format(project.frGoal)
                    : new Intl.NumberFormat("hr-HR", {
                        style: "currency",
                        currency: "EUR",
                      }).format(project.frGoal || 0) || "Not specified"}
                </p>
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

        {/* Fundraising Progress Section */}
        {project.frGoal && (
          <Card>
            <CardHeader>
              <CardTitle>Fundraising Progress</CardTitle>
              <CardDescription>
                Progress towards the fundraising goal based on successful
                collaborations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Raised</span>
                  <span className="font-medium">
                    {new Date(project.updated_at || new Date()) <
                    new Date("2023-01-01")
                      ? new Intl.NumberFormat("hr-HR", {
                          style: "currency",
                          currency: "HRK",
                        }).format(totalRaised)
                      : new Intl.NumberFormat("hr-HR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(totalRaised)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Goal</span>
                  <span className="font-medium">
                    {new Date(project.updated_at || new Date()) <
                    new Date("2023-01-01")
                      ? new Intl.NumberFormat("hr-HR", {
                          style: "currency",
                          currency: "HRK",
                        }).format(project.frGoal)
                      : new Intl.NumberFormat("hr-HR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(project.frGoal)}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {progressPercentage.toFixed(1)}% Complete
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(project.updated_at || new Date()) <
                    new Date("2023-01-01")
                      ? new Intl.NumberFormat("hr-HR", {
                          style: "currency",
                          currency: "HRK",
                        }).format(Math.max(0, project.frGoal - totalRaised))
                      : new Intl.NumberFormat("hr-HR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(
                          Math.max(0, project.frGoal - totalRaised)
                        )}{" "}
                    remaining
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
        isLoading={isSubmitting}
      />

      <CollaborationDialog
        open={collaborationDialogOpen}
        onOpenChange={setCollaborationDialogOpen}
        collaboration={editingCollaboration}
        projectId={projectId}
        onSubmit={handleSubmitCollaboration}
        isLoading={isSubmitting}
      />
    </div>
  );
}
