"use client";

import { Plus } from "lucide-react";
import { ProjectsTable } from "@/app/projects/components/table/projects-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ProjectForm } from "@/app/projects/components/project-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectsTable } from "@/app/projects/hooks/use-projects-table";
import { useProjectOperations } from "@/app/projects/hooks/use-project-operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Project, ProjectFormData } from "@/types/project";
import { Suspense } from "react";

export default function ProjectsPage() {
  const isMobile = useIsMobile();
  const { isAdmin, isPending: isAdminPending } = useIsAdmin();

  // Custom hooks for table management and project operations
  const {
    tablePreferences,
    searchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    columnSelectorFields,
    visibleColumnsString,
  } = useProjectsTable();

  const {
    projects,
    isLoadingProjects,
    dialogOpen,
    setDialogOpen,
    editingProject,
    handleCreateProject,
    handleEditProject,
    handleSubmitProject,
    handleDeleteProject,
    isSubmitting,
  } = useProjectOperations();

  // Transform editingProject to ProjectFormData for FormDialog
  const initialFormData: ProjectFormData | undefined = editingProject
    ? {
        name: editingProject.name,
        frGoal: editingProject.frGoal,
      }
    : undefined;

  return (
    <div className="mx-auto p-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
              Projects
            </h1>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
          {isAdmin && (
            <Button
              onClick={handleCreateProject}
              size={isMobile ? "sm" : "default"}
            >
              <Plus className="size-4" />
              New Project
            </Button>
          )}
        </div>

        {/* Search Bar and Column Selector */}
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
          <Suspense>
            <SearchBar
              placeholder="Search projects..."
              onSearchChange={handleSearchChange}
              searchParam="projects_search"
            />
          </Suspense>

          <ColumnSelector
            fields={columnSelectorFields}
            visibleColumns={visibleColumnsString}
            onColumnsChange={handleUpdateVisibleColumns}
            placeholder="Select columns"
          />
        </div>

        {isLoadingProjects ? (
          <BlocksWaveLoader size={96} className="my-16" />
        ) : (
          <ProjectsTable
            projects={projects}
            searchQuery={searchQuery}
            tablePreferences={tablePreferences}
            onEdit={isAdmin ? handleEditProject : undefined}
            onDelete={isAdmin ? handleDeleteProject : undefined}
            onSortColumn={handleSortColumn}
          />
        )}
      </div>

      <FormDialog<ProjectFormData>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entity="Project"
        initialData={initialFormData}
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
