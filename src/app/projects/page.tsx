"use client";

import { ProjectsTable } from "@/components/projects/projects-table";
import { FormDialog } from "@/components/common/form-dialog";
import { ProjectForm } from "@/components/projects/project-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { ProjectsPageHeader } from "@/components/projects/projects-page-header";
import { useProjectsTable } from "@/hooks/use-projects-table";
import { useProjectOperations } from "@/hooks/use-project-operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Project } from "@/types/project";

export default function ProjectsPage() {
  const isMobile = useIsMobile();

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

  return (
    <div className="mx-auto p-4">
      <div className="space-y-6">
        <ProjectsPageHeader
          projectsCount={projects.length}
          isMobile={isMobile}
          onCreateProject={handleCreateProject}
        />

        {/* Search Bar and Column Selector */}
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
          <SearchBar
            placeholder="Search projects..."
            onSearchChange={handleSearchChange}
            searchParam="projects_search"
          />

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
