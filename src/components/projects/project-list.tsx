"use client";

import { useState, useMemo } from "react";
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
import {
  Pencil,
  Trash2,
  Eye,
  Briefcase,
  Target,
  Calendar,
  CalendarDays,
  Hash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TableActions } from "@/components/table-actions";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  isColumnVisible,
  updateVisibleColumns,
  handleSort,
  getSortIcon,
  visibleColumnsToStrings,
} from "@/lib/table-utils";
import { formatDate, formatAmount } from "@/lib/format-utils";

// Define available columns for the table using Project type
const PROJECT_FIELDS: Array<{
  id: keyof Project;
  label: string;
  required: boolean;
  sortable: boolean;
  center: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "id",
    label: "ID",
    required: false,
    sortable: true,
    center: true,
  },
  {
    id: "name",
    label: "Name",
    required: true,
    sortable: true,
    center: false,
    icon: Briefcase,
  },
  {
    id: "frGoal",
    label: "FR Goal",
    required: false,
    sortable: true,
    center: true,
    icon: Target,
  },
  {
    id: "created_at",
    label: "Created at",
    required: false,
    sortable: true,
    center: false,
    icon: Calendar,
  },
  {
    id: "updated_at",
    label: "Updated at",
    required: false,
    sortable: true,
    center: false,
    icon: CalendarDays,
  },
];

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: number) => Promise<void>;
}

export function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  // Consolidated table preferences state
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<Project>
  >({
    visibleColumns: ["name", "frGoal", "created_at", "updated_at"], // Default visible columns
    sortField: PROJECT_FIELDS[1].id, // Default to second column (name)
    sortDirection: "asc", // Default sort direction
  });

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

      <div className="rounded-md border">
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
                      <TableCell key={column.id}>
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
