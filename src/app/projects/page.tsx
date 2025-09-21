"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectsTable } from "@/components/projects/projects-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ProjectForm } from "@/components/projects/project-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { Project, ProjectFormData } from "@/types/project";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { PROJECT_FIELDS } from "@/config/project-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";

// Default preferences (outside component to prevent recreation)
const defaultPreferences: TablePreferences<Project> = {
  visibleColumns: ["name", "frGoal", "created_at"],
  sortField: "name",
  sortDirection: "asc",
};

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  // Table preferences state
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<Project>
  >(() => {
    // Initialize with saved preferences on first render
    return getTablePreferences("projects", defaultPreferences);
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    saveTablePreferences("projects", tablePreferences);
  }, [tablePreferences]);

  // Debounce search query for client-side filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch ALL projects at once (no server-side search filtering)
  const { data: projects = [], isLoading: loading, error } = useProjects(); // No search parameter - fetch all projects

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  // Memoize column selector handler
  const handleUpdateVisibleColumns = useCallback(
    (newVisibleColumns: string[]) => {
      const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
      setTablePreferences((prev) => ({
        ...prev,
        visibleColumns: visibleColumns,
      }));
    },
    []
  );

  // Handle sorting functionality
  const handleSortColumn = useCallback(
    (field: keyof Project) => {
      const newPreferences = handleSort(tablePreferences, field);
      setTablePreferences(newPreferences);
    },
    [tablePreferences]
  );

  // Memoize column selector fields to prevent recreation
  const columnSelectorFields = useMemo(
    () =>
      PROJECT_FIELDS.map((field) => ({
        id: field.id,
        label: field.label,
        required: field.required,
      })),
    []
  );

  // Memoize visible columns to prevent recreation
  const visibleColumnsString = useMemo(
    () => visibleColumnsToStrings(tablePreferences.visibleColumns),
    [tablePreferences.visibleColumns]
  );

  // Handle search query updates from SearchBar component
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          <Button onClick={handleCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Search Bar and Column Selector */}
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
          <SearchBar
            placeholder="Search projects..."
            onSearchChange={handleSearchChange}
          />

          <ColumnSelector
            fields={columnSelectorFields}
            visibleColumns={visibleColumnsString}
            onColumnsChange={handleUpdateVisibleColumns}
            placeholder="Select columns"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading projects...
          </div>
        ) : (
          <ProjectsTable
            projects={projects}
            searchQuery={debouncedSearchQuery}
            tablePreferences={tablePreferences}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onSortColumn={handleSortColumn}
          />
        )}
      </div>

      <FormDialog<Project>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entity="Project"
        initialData={editingProject}
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
    </div>
  );
}
