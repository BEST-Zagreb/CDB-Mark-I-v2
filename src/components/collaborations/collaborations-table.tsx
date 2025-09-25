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
import { Collaboration } from "@/types/collaboration";
import { type TablePreferences } from "@/types/table";
import { isColumnVisible, getSortIcon } from "@/lib/table-utils";
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
import { CollaborationsTableRow } from "@/components/collaborations/collaborations-table-row";
import { useVirtualizedCollaborations } from "@/hooks/use-virtualized-collaborations";

interface VirtualizedCollaborationListProps {
  collaborations: (Collaboration & {
    companyName?: string;
    projectName?: string;
    contactName?: string;
  })[];
  searchQuery: string;
  tablePreferences: TablePreferences<
    Collaboration & {
      companyName?: string;
      projectName?: string;
      contactName?: string;
    }
  >;
  onEdit: (collaboration: Collaboration) => void;
  onDelete: (collaborationId: number) => Promise<void>;
  onSortColumn: (
    field: keyof (Collaboration & {
      companyName?: string;
      projectName?: string;
      contactName?: string;
    })
  ) => void;
  hiddenColumns?: string[];
}

export function CollaborationsTable({
  collaborations,
  searchQuery,
  tablePreferences,
  onEdit,
  onDelete,
  onSortColumn,
  hiddenColumns = [],
}: VirtualizedCollaborationListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort collaborations based on current sort field and direction
  const sortedCollaborations = useMemo(() => {
    return [...collaborations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const { sortField, sortDirection } = tablePreferences;

      // Handle different field types
      switch (sortField) {
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case "amount":
        case "contactId":
          aValue = (a as any)[sortField];
          bValue = (b as any)[sortField];
          break;
        case "successful":
        case "contacted":
        case "letter":
        case "meeting":
        case "contactInFuture":
          // Handle boolean fields - null values come last
          aValue = (a as any)[sortField];
          bValue = (b as any)[sortField];
          break;
        case "updatedAt":
        case "createdAt":
          aValue = (a as any)[sortField]
            ? new Date((a as any)[sortField]).getTime()
            : null;
          bValue = (b as any)[sortField]
            ? new Date((b as any)[sortField]).getTime()
            : null;
          break;
        default:
          // For string fields, convert to lowercase for case-insensitive sorting
          aValue = (a as any)[sortField];
          bValue = (b as any)[sortField];
          break;
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
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    collaborations,
    tablePreferences.sortField,
    tablePreferences.sortDirection,
  ]);

  // Use virtualization hook
  const {
    visibleCollaborations,
    rowVirtualizer,
    hasMore,
    totalCount,
    visibleCount,
  } = useVirtualizedCollaborations({
    collaborations: sortedCollaborations,
    searchQuery,
    containerRef: containerRef as React.RefObject<HTMLElement>,
  });

  // Filter out hidden columns
  const visibleColumnsFields = COLLABORATION_FIELDS.filter(
    (field) => !hiddenColumns.includes(field.id)
  );

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery
          ? `No collaborations found matching "${searchQuery}"`
          : "No collaborations found. Create your first collaboration to get started."}
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
            {visibleColumnsFields.map((column) => {
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
            const collaboration = visibleCollaborations[virtualRow.index];
            if (!collaboration) return null;

            return (
              <CollaborationsTableRow
                key={collaboration.id}
                collaboration={collaboration}
                tablePreferences={tablePreferences}
                onEdit={onEdit}
                onDeleteConfirm={onDelete}
                hiddenColumns={hiddenColumns}
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
