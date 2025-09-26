"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { TableCell, TableRow } from "@/components/ui/table";
import { TableActions } from "@/components/common/table/table-actions";
import { isColumnVisible } from "@/lib/table-utils";
import { formatDate, formatCurrency } from "@/lib/format-utils";
import { PROJECT_FIELDS } from "@/config/project-fields";
import { Project } from "@/types/project";
import { type TablePreferences } from "@/types/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectsTableRowProps {
  project: Project;
  tablePreferences: TablePreferences;
  onEdit: (project: Project) => void;
  onDeleteConfirm: (projectId: number) => Promise<void>;
}

export const ProjectsTableRow = memo(function ProjectTableRow({
  project,
  tablePreferences,
  onEdit,
  onDeleteConfirm,
}: ProjectsTableRowProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  // Memoize the view handler to prevent recreation
  const handleView = useCallback(
    (project: Project) => router.push(`/projects/${project.id}`),
    [router]
  );

  // Memoize the delete handler to prevent recreation
  const handleDelete = useCallback(
    (project: Project) => {
      showDeleteAlert({
        entity: "project",
        entityName: project.name,
        onConfirm: () => onDeleteConfirm(project.id),
      });
    },
    [showDeleteAlert, onDeleteConfirm]
  );

  return (
    <TableRow key={project.id}>
      {PROJECT_FIELDS.map((column) => {
        if (!isColumnVisible(column.id, tablePreferences) && !column.required)
          return null;

        // Handle special formatting for specific columns
        if (column.id === "name") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${
                column.center ? "text-center" : "font-medium"
              }`}
            >
              <Link
                href={`/projects/${project.id}`}
                className="text-primary hover:underline text-pretty"
              >
                {project.name || "—"}
              </Link>
            </TableCell>
          );
        } else if (column.id === "frGoal") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">
                {formatCurrency(
                  project.frGoal || 0,
                  project.created_at || project.updated_at
                )}
              </div>
            </TableCell>
          );
        } else if (column.id === "created_at" || column.id === "updated_at") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">
                {formatDate(project[column.id])}
              </div>
            </TableCell>
          );
        }

        return (
          <TableCell
            key={column.id}
            className={`max-w-50 ${
              column.center ? "text-center" : "font-medium"
            }`}
          >
            <div className="text-pretty">{project[column.id] || "—"}</div>
          </TableCell>
        );
      })}

      {/* Actions - Always visible */}
      <TableActions
        item={project}
        onView={isMobile ? undefined : handleView}
        onEdit={onEdit}
        onDelete={handleDelete}
      />
    </TableRow>
  );
});
