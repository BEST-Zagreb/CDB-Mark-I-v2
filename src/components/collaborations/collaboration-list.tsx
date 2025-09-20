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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import {
  Collaboration,
  getCollaborationStatusText,
  getCollaborationStatusColor,
  getCollaborationTypeDisplay,
  getPriorityDisplay,
} from "@/types/collaboration";
import { type TablePreferences } from "@/types/table";
import { User, Calendar, DollarSign, Building2 } from "lucide-react";
import { TableActions } from "@/components/ui/table-actions";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  isColumnVisible,
  updateVisibleColumns,
  handleSort,
  getSortIcon,
  visibleColumnsToStrings,
} from "@/lib/table-utils";
import { formatDate, formatAmount } from "@/lib/format-utils";

// Define available columns for the table using Collaboration type
const COLLABORATION_FIELDS: Array<{
  id: keyof Collaboration | "companyName" | "projectName";
  label: string;
  required: boolean;
  sortable: boolean;
  center: boolean;
}> = [
  { id: "id", label: "ID", required: false, sortable: true, center: true },
  {
    id: "companyName",
    label: "Company",
    required: true,
    sortable: true,
    center: false,
  },
  {
    id: "projectName",
    label: "Project",
    required: false,
    sortable: true,
    center: false,
  },
  { id: "type", label: "Type", required: false, sortable: true, center: false },
  {
    id: "responsible",
    label: "Responsible",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "priority",
    label: "Priority",
    required: false,
    sortable: true,
    center: true,
  },
  {
    id: "successful",
    label: "Successful",
    required: false,
    sortable: true,
    center: true,
  },
  {
    id: "comment",
    label: "Comment",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "amount",
    label: "Amount",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "contacted",
    label: "Contacted",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "updatedAt",
    label: "Updated",
    required: false,
    sortable: true,
    center: false,
  },
];

interface CollaborationListProps {
  collaborations: Collaboration[];
  onEdit: (collaboration: Collaboration) => void;
  onDelete: (collaborationId: number) => Promise<void>;
  isLoading?: boolean;
  showProjectNames?: boolean; // New prop to show project names instead of company names
}

export function CollaborationList({
  collaborations,
  onEdit,
  onDelete,
  isLoading = false,
  showProjectNames = false,
}: CollaborationListProps) {
  const { showDeleteAlert } = useDeleteAlert();

  // Consolidated table preferences state
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<
      Collaboration & { companyName?: string; projectName?: string }
    >
  >({
    visibleColumns: showProjectNames
      ? ["projectName", "type", "responsible", "priority", "successful"]
      : ["companyName", "type", "responsible", "priority", "successful"], // Default visible columns
    sortField: "priority", // Default sort field
    sortDirection: "desc", // Default sort direction
  });

  function handleUpdateVisibleColumns(newVisibleColumns: string[]) {
    const requiredColumn = showProjectNames ? "projectName" : "companyName";
    const visibleColumns = updateVisibleColumns(
      newVisibleColumns,
      requiredColumn
    );
    setTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  }

  function handleSortColumn(
    field: keyof (Collaboration & {
      companyName?: string;
      projectName?: string;
    })
  ) {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  }

  // Sort collaborations based on current sort field and direction
  const sortedCollaborations = useMemo(() => {
    return [...collaborations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const { sortField, sortDirection } = tablePreferences;

      // Handle different field types
      switch (sortField) {
        case "priority":
          aValue = a.priority ?? -1;
          bValue = b.priority ?? -1;
          break;
        case "amount":
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case "successful":
          aValue = a.successful ? 1 : 0;
          bValue = b.successful ? 1 : 0;
          break;
        case "updatedAt":
          aValue = new Date((a as any)[sortField] || 0).getTime();
          bValue = new Date((b as any)[sortField] || 0).getTime();
          break;
        case "contacted":
          aValue = a.contacted ? 1 : 0;
          bValue = b.contacted ? 1 : 0;
          break;
        default:
          // For string fields, convert to lowercase for case-insensitive sorting
          aValue = String((a as any)[sortField] || "").toLowerCase();
          bValue = String((b as any)[sortField] || "").toLowerCase();
          break;
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

  function handleDeleteCollaboration(collaboration: Collaboration) {
    showDeleteAlert({
      entity: "collaboration",
      entityName: collaboration.responsible || "Nepoznato",
      onConfirm: () => onDelete(collaboration.id),
    });
  }

  if (collaborations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No collaborations found for this project.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">Collaborations</h2>
          <Badge variant="secondary">{collaborations.length}</Badge>
        </div>
        <ColumnSelector
          fields={COLLABORATION_FIELDS.map((field) => ({
            id: field.id as string,
            label: field.label,
            required: field.required,
          }))}
          visibleColumns={visibleColumnsToStrings(
            tablePreferences.visibleColumns
          )}
          onColumnsChange={handleUpdateVisibleColumns}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLLABORATION_FIELDS.filter((field) =>
                isColumnVisible(field.id, tablePreferences)
              ).map((field) => (
                <TableHead
                  key={field.id}
                  className={field.center ? "text-center" : ""}
                >
                  {field.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSortColumn(field.id)}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <span className="flex items-center gap-2">
                        {field.label}
                        {getSortIcon(field.id, tablePreferences)}
                      </span>
                    </Button>
                  ) : (
                    field.label
                  )}
                </TableHead>
              ))}
              <TableHead className="text-center w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={
                    COLLABORATION_FIELDS.filter((field) =>
                      isColumnVisible(field.id, tablePreferences)
                    ).length + 1
                  }
                  className="text-center py-8"
                >
                  Loading collaborations...
                </TableCell>
              </TableRow>
            ) : (
              sortedCollaborations.map(
                (
                  collaboration: Collaboration & {
                    companyName?: string;
                    projectName?: string;
                  }
                ) => (
                  <TableRow key={collaboration.id}>
                    {COLLABORATION_FIELDS.filter((field) =>
                      isColumnVisible(field.id, tablePreferences)
                    ).map((field) => (
                      <TableCell
                        key={field.id}
                        className={field.center ? "text-center" : ""}
                      >
                        {field.id === "id" && collaboration.id}
                        {field.id === "companyName" &&
                          (collaboration.companyName || "—")}
                        {field.id === "projectName" &&
                          (collaboration.projectName || "—")}
                        {field.id === "type" && (
                          <Badge variant="outline">
                            {getCollaborationTypeDisplay(collaboration.type)}
                          </Badge>
                        )}
                        {field.id === "responsible" && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {collaboration.responsible || "—"}
                          </div>
                        )}
                        {field.id === "priority" && (
                          <Badge
                            variant={
                              collaboration.priority &&
                              collaboration.priority >= 8
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {getPriorityDisplay(collaboration.priority)}
                          </Badge>
                        )}
                        {field.id === "successful" && (
                          <Badge
                            variant={
                              collaboration.successful ? "default" : "secondary"
                            }
                          >
                            {collaboration.successful ? "Yes" : "No"}
                          </Badge>
                        )}
                        {field.id === "comment" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[200px] truncate">
                                  {collaboration.comment}
                                </div>
                              </TooltipTrigger>

                              <TooltipContent>
                                <p className="max-w-xs font-medium whitespace-pre-wrap p-1">
                                  {collaboration.comment}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {field.id === "amount" && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {formatAmount(
                              collaboration.amount,
                              collaboration.updatedAt
                            )}
                          </div>
                        )}
                        {field.id === "contacted" && (
                          <Badge
                            variant={
                              collaboration.contacted ? "default" : "secondary"
                            }
                          >
                            {collaboration.contacted ? "Yes" : "No"}
                          </Badge>
                        )}
                        {field.id === "updatedAt" && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(collaboration.updatedAt)}
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <TableActions
                        item={collaboration}
                        onEdit={() => onEdit(collaboration)}
                        onDelete={() =>
                          handleDeleteCollaboration(collaboration)
                        }
                        viewDisabled={true} // Collaboration view not implemented
                      />
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
