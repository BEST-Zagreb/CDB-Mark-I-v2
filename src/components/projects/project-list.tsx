"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { Project } from "@/types/project";
import { type TablePreferences } from "@/types/table";
import { useRouter } from "next/navigation";
import { TableActions } from "@/components/common/table/table-actions";
import { ColumnSelector } from "@/components/common/table/column-selector";
import {
  isColumnVisible,
  updateVisibleColumns,
  handleSort,
  getSortIcon,
  visibleColumnsToStrings,
} from "@/lib/table-utils";
import { formatDate, formatAmount } from "@/lib/format-utils";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import { PROJECT_FIELDS } from "@/config/project-fields";

// Default preferences (outside component to prevent recreation)
const defaultPreferences: TablePreferences<Project> = {
  visibleColumns: ["name", "frGoal", "created_at"],
  sortField: "name",
  sortDirection: "asc",
};

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: number) => Promise<void>;
}

export default function ProjectList({
  projects,
  onEdit,
  onDelete,
}: ProjectListProps) {
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  // Consolidated table preferences state with localStorage
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

  function handleUpdateVisibleColumns(newVisibleColumns: string[]) {
    const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
    setTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  }

  function handleSortColumn(field: keyof Project) {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  }

  // Sort projects based on current sort field and direction
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const { sortField, sortDirection } = tablePreferences;

      // Handle different field types
      switch (sortField) {
        case "name":
          aValue = String(a.name || "").toLowerCase();
          bValue = String(b.name || "").toLowerCase();
          break;
        case "frGoal":
          aValue = a.frGoal || 0;
          bValue = b.frGoal || 0;
          break;
        case "created_at":
        case "updated_at":
          // Handle null dates by putting them at the end
          aValue = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
          bValue = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
          break;
        default:
          aValue = String(a[sortField as keyof Project] || "").toLowerCase();
          bValue = String(b[sortField as keyof Project] || "").toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [projects, tablePreferences.sortField, tablePreferences.sortDirection]);

  function handleDelete(project: Project) {
    showDeleteAlert({
      entity: "project",
      entityName: project.name,
      onConfirm: () => onDelete(project.id),
    });
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No projects found. Create your first project to get started.
      </div>
    );
  }

  return (
    <>
      {/* Column Selector */}
      <ColumnSelector
        fields={PROJECT_FIELDS.map((field) => ({
          id: field.id,
          label: field.label,
          required: field.required,
        }))}
        visibleColumns={visibleColumnsToStrings(
          tablePreferences.visibleColumns
        )}
        onColumnsChange={handleUpdateVisibleColumns}
        placeholder="Select columns"
      />

      <div className="rounded-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              {PROJECT_FIELDS.map((column) => {
                if (!isColumnVisible(column.id, tablePreferences)) return null;

                return (
                  <TableHead
                    key={column.id}
                    className={column.center ? "text-center" : ""}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSortColumn(column.id)}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        <span className="flex items-center gap-2">
                          {column.icon && (
                            <column.icon className="h-4 w-4 text-muted-foreground" />
                          )}
                          {column.label}
                          {getSortIcon(column.id, tablePreferences)}
                        </span>
                      </Button>
                    ) : (
                      <span className="flex items-center gap-2">
                        {column.icon && (
                          <column.icon className="h-4 w-4 text-muted-foreground" />
                        )}
                        {column.label}
                      </span>
                    )}
                  </TableHead>
                );
              })}

              {/* Actions - Always visible */}
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project) => (
              <TableRow key={project.id}>
                {PROJECT_FIELDS.map((column) => {
                  if (
                    !isColumnVisible(column.id, tablePreferences) &&
                    !column.required
                  )
                    return null;

                  // Handle special formatting for specific columns
                  if (column.id === "frGoal") {
                    return (
                      <TableCell
                        key={column.id}
                        className={column.center ? "text-center" : ""}
                      >
                        {formatAmount(
                          project.frGoal,
                          project.created_at || project.updated_at
                        )}
                      </TableCell>
                    );
                  } else if (
                    column.id === "created_at" ||
                    column.id === "updated_at"
                  ) {
                    return (
                      <TableCell key={column.id}>
                        {formatDate(project[column.id])}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={column.id}
                      className={
                        column.center
                          ? "text-center"
                          : "font-medium whitespace-normal"
                      }
                    >
                      {project[column.id] || "—"}
                    </TableCell>
                  );
                })}

                {/* Actions - Always visible */}
                <TableActions
                  item={project}
                  onView={(project) => router.push(`/projects/${project.id}`)}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
