"use client";

import { useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Project } from "@/types/project";
import { type TablePreferences } from "@/types/table";
import { isColumnVisible, getSortIcon } from "@/lib/table-utils";
import { PROJECT_FIELDS } from "@/config/project-fields";
import { ProjectsTableRow } from "@/app/projects/components/table/projects-table-row";
import { useVirtualizedProjects } from "@/app/projects/hooks/use-virtualized-projects";

interface VirtualizedProjectListProps {
  projects: Project[];
  searchQuery: string;
  tablePreferences: TablePreferences;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => Promise<void>;
  onSortColumn: (field: keyof Project) => void;
}

export function ProjectsTable({
  projects,
  searchQuery,
  tablePreferences,
  onEdit,
  onDelete,
  onSortColumn,
}: VirtualizedProjectListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort projects based on current sort field and direction
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aValue: string | number | Date | null;
      let bValue: string | number | Date | null;

      const { sortField, sortDirection } = tablePreferences;

      // Handle different field types
      switch (sortField) {
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "frGoal":
          aValue = a.frGoal;
          bValue = b.frGoal;
          break;
        case "created_at":
        case "updated_at":
          // Handle null dates by putting them at the end
          aValue = a[sortField] ? new Date(a[sortField]!).getTime() : null;
          bValue = b[sortField] ? new Date(b[sortField]!).getTime() : null;
          break;
        default:
          aValue = a[sortField as keyof Project];
          bValue = b[sortField as keyof Project];
      }

      // Handle null/undefined values - they should always sort to the bottom
      const aIsEmpty =
        aValue == null || (typeof aValue === "string" && aValue.trim() === "");
      const bIsEmpty =
        bValue == null || (typeof bValue === "string" && bValue.trim() === "");

      if (aIsEmpty && bIsEmpty) return 0;
      if (aIsEmpty) return 1; // a is empty, b is not - a goes to bottom
      if (bIsEmpty) return -1; // b is empty, a is not - a goes to top

      // For string comparison, convert to lowercase
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Both values are valid, compare normally
      if (aValue! < bValue!) return sortDirection === "asc" ? -1 : 1;
      if (aValue! > bValue!) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [projects, tablePreferences.sortField, tablePreferences.sortDirection]);

  // Use virtualization hook
  const { visibleProjects, rowVirtualizer, hasMore, totalCount, visibleCount } =
    useVirtualizedProjects({
      projects: sortedProjects,
      searchQuery,
      containerRef: containerRef as React.RefObject<HTMLElement>,
    });

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery
          ? `No projects found matching "${searchQuery}"`
          : "Create your first project to get started"}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-sm border bg-zinc-50 overflow-hidden"
    >
      <Table>
        <TableHeader className="bg-zinc-100">
          <TableRow>
            {PROJECT_FIELDS.map((column) => {
              if (!isColumnVisible(column.id, tablePreferences)) return null;

              return (
                <TableHead
                  key={column.id}
                  className={`${column.center ? "text-center" : ""}`}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => onSortColumn(column.id)}
                      className="h-auto p-0 font-bold hover:bg-transparent"
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
            <TableHead className="text-center font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>

        {/* Virtualized Table Body */}
        <TableBody>
          {/* Spacer for non-visible items above */}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr
              style={{
                height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px`,
              }}
            >
              <td></td>
            </tr>
          )}

          {/* Render visible items */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const project = visibleProjects[virtualRow.index];
            if (!project) return null;

            return (
              <ProjectsTableRow
                key={project.id}
                project={project}
                tablePreferences={tablePreferences}
                onEdit={onEdit}
                onDeleteConfirm={onDelete}
              />
            );
          })}

          {/* Spacer for non-visible items below */}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr
              style={{
                height: `${
                  rowVirtualizer.getTotalSize() -
                  (rowVirtualizer.getVirtualItems()[
                    rowVirtualizer.getVirtualItems().length - 1
                  ]?.end || 0)
                }px`,
              }}
            >
              <td></td>
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
