"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardPaste,
  Copy,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormDialog } from "@/components/common/form-dialog";
import { ProjectForm } from "@/components/projects/project-form";
import { CollaborationsTable } from "@/components/collaborations/collaborations-table";
import { CollaborationForm } from "@/components/collaborations/form/collaboration-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import {
  useDeleteProject,
  useProject,
  useUpdateProject,
} from "@/hooks/use-projects";
import {
  useCollaborationsByProject,
  useCreateCollaboration,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/use-collaborations";
import { Project, ProjectFormData } from "@/types/project";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeleteAlert } from "@/contexts/delete-alert-context";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  const { showDeleteAlert } = useDeleteAlert();
  const isMobile = useIsMobile();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [editingCollaboration, setEditingCollaboration] = useState<
    Collaboration | undefined
  >();
  const [searchQuery, setSearchQuery] = useState("");

  // Table preferences state for collaborations
  const defaultPreferences: TablePreferences<
    Collaboration & {
      companyName?: string;
      projectName?: string;
      contactName?: string;
    }
  > = {
    visibleColumns: [
      "companyName",
      "responsible",
      "priority",
      "contactName",
      "comment",
    ],
    sortField: "priority",
    sortDirection: "desc",
  };

  const [tablePreferences, setTablePreferences] = useState(() => {
    return getTablePreferences("collaborations-projects", defaultPreferences);
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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
  const deleteProjectMutation = useDeleteProject();
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
      .filter((collaboration) => collaboration.amount)
      .reduce((sum, collaboration) => sum + (collaboration.amount || 0), 0);

    const progressPercentage = (totalRaised / project.frGoal) * 100;

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

  // Save table preferences to localStorage
  useEffect(() => {
    saveTablePreferences("collaborations-projects", tablePreferences);
  }, [tablePreferences]);

  // Table handler functions
  const handleUpdateVisibleColumns = (newVisibleColumns: string[]) => {
    const visibleColumns = updateVisibleColumns(
      newVisibleColumns,
      "companyName"
    );
    setTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  };

  const handleSortColumn = (
    field: keyof (Collaboration & {
      companyName?: string;
      projectName?: string;
      contactName?: string;
    })
  ) => {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleEditProject = () => {
    setEditDialogOpen(true);
  };

  function handleDeleteProject(project: Project) {
    showDeleteAlert({
      entity: "project",
      entityName: project.name,
      onConfirm: () => deleteProjectMutation.mutate(project.id),
    });
  }

  const handleSubmitProject = async (data: ProjectFormData) => {
    if (!project) return;
    await updateProjectMutation.mutateAsync({ id: project.id, data });
    setEditDialogOpen(false);
  };

  const handleAddCollaboration = () => {
    setEditingCollaboration(undefined);
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
      <div className="mx-auto p-4">
        <div className="text-center py-8 text-muted-foreground">
          Loading project...
        </div>
      </div>
    );
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

          <div className="space-x-2 sm:space-x-4">
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
                Progress towards the fundraising goal based on collaborations
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
                <div className="flex items-center gap-2">
                  <CardTitle>Collaborations</CardTitle>
                  <Badge variant="secondary">{collaborations.length}</Badge>
                </div>
                <CardDescription>
                  Companies and organizations involved in this project
                </CardDescription>
              </div>

              <div className="space-x-2 sm:space-x-4">
                <Button
                  onClick={handleAddCollaboration}
                  size={isMobile ? "icon" : "default"}
                >
                  <ClipboardPaste className="size-5" />
                  {!isMobile && "Copy Collaborations"}
                </Button>

                <Button
                  onClick={handleAddCollaboration}
                  size={isMobile ? "icon" : "default"}
                >
                  <Plus className="size-5" />
                  {!isMobile && "New Collaboration"}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search Bar and Column Selector */}
            <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
              <SearchBar
                placeholder="Search collaborations..."
                onSearchChange={handleSearchChange}
                searchParam="collaborations_search"
              />

              <ColumnSelector
                fields={COLLABORATION_FIELDS.filter((field) => {
                  // Filter out project name column since we're on a project page
                  if (field.id === "projectName") return false;
                  return true;
                }).map((field) => ({
                  id: field.id as string,
                  label: field.label,
                  required: field.required,
                }))}
                visibleColumns={visibleColumnsToStrings(
                  tablePreferences.visibleColumns
                )}
                onColumnsChange={handleUpdateVisibleColumns}
                placeholder="Select columns"
              />
            </div>

            <CollaborationsTable
              collaborations={collaborations}
              searchQuery={debouncedSearchQuery}
              tablePreferences={tablePreferences}
              onEdit={handleEditCollaboration}
              onDelete={handleDeleteCollaboration}
              onSortColumn={handleSortColumn}
              hiddenColumns={["projectName"]}
            />
          </CardContent>
        </Card>
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
