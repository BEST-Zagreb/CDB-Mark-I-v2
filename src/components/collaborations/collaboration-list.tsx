"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
  getPriorityOrder,
} from "@/types/collaboration";
import { type TablePreferences } from "@/types/table";
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
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
import { Building2 } from "lucide-react";

interface CollaborationListProps {
  collaborations: Collaboration[];
  onEdit?: (collaboration: Collaboration) => void;
  onDelete?: (collaborationId: number) => Promise<void>;
  showProjectNames?: boolean; // New prop to show project names instead of company names
}

export function CollaborationList({
  collaborations,
  onEdit,
  onDelete,
  showProjectNames = false,
}: CollaborationListProps) {
  const { showDeleteAlert } = useDeleteAlert();

  // Default preferences (using useMemo since it depends on showProjectNames)
  const defaultPreferences = useMemo(() => {
    const defaultColumns = [
      showProjectNames ? "projectName" : "companyName",
      "responsible",
      "priority",
      "personName",
      "comment",
      "contacted",
    ] as const;

    return {
      visibleColumns: defaultColumns as any,
      sortField: "priority" as any,
      sortDirection: "desc" as const,
    };
  }, [showProjectNames]);

  // Consolidated table preferences state with localStorage
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<
      Collaboration & {
        companyName?: string;
        projectName?: string;
        personName?: string;
      }
    >
  >(() => {
    // Initialize with saved preferences on first render
    return getTablePreferences("collaborations", defaultPreferences as any);
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    saveTablePreferences("collaborations", tablePreferences);
  }, [tablePreferences]);

  // Update preferences when showProjectNames changes
  useEffect(() => {
    const savedPreferences = getTablePreferences(
      "collaborations",
      defaultPreferences as any
    );
    setTablePreferences(savedPreferences);
  }, [defaultPreferences]);

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
      personName?: string;
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
          aValue = getPriorityOrder(a.priority || "low");
          bValue = getPriorityOrder(b.priority || "low");
          break;
        case "amount":
        case "personId":
          aValue = (a as any)[sortField] || 0;
          bValue = (b as any)[sortField] || 0;
          break;
        case "successful":
        case "contacted":
        case "letter":
        case "meeting":
        case "contactInFuture":
          // Handle boolean fields - null values come last
          const aBool = (a as any)[sortField];
          const bBool = (b as any)[sortField];
          aValue = aBool === null ? -1 : aBool ? 1 : 0;
          bValue = bBool === null ? -1 : bBool ? 1 : 0;
          break;
        case "updatedAt":
        case "createdAt":
          aValue = new Date((a as any)[sortField] || 0).getTime();
          bValue = new Date((b as any)[sortField] || 0).getTime();
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

  function handleDelete(collaboration: Collaboration) {
    if (onDelete) {
      showDeleteAlert({
        entity: "collaboration",
        entityName: collaboration.responsible || "Nepoznato",
        onConfirm: () => onDelete(collaboration.id),
      });
    }
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

      <div className="rounded-sm border">
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
                        {field.icon && (
                          <field.icon className="h-4 w-4 text-muted-foreground" />
                        )}
                        {field.label}
                        {getSortIcon(field.id, tablePreferences)}
                      </span>
                    </Button>
                  ) : (
                    <span className="flex items-center gap-2">
                      {field.icon && (
                        <field.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {field.label}
                    </span>
                  )}
                </TableHead>
              ))}
              <TableHead className="text-center w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCollaborations.map(
              (
                collaboration: Collaboration & {
                  companyName?: string;
                  projectName?: string;
                  personName?: string;
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
                        (collaboration.companyName &&
                        collaboration.companyId ? (
                          <Link
                            href={`/companies/${collaboration.companyId}`}
                            className="text-primary hover:underline"
                          >
                            {collaboration.companyName}
                          </Link>
                        ) : (
                          collaboration.companyName || "—"
                        ))}
                      {field.id === "projectName" &&
                        (collaboration.projectName &&
                        collaboration.projectId ? (
                          <Link
                            href={`/projects/${collaboration.projectId}`}
                            className="text-primary hover:underline"
                          >
                            {collaboration.projectName}
                          </Link>
                        ) : (
                          collaboration.projectName || "—"
                        ))}
                      {field.id === "personId" &&
                        (collaboration.personId || "—")}
                      {field.id === "personName" &&
                        (collaboration.personName || "—")}
                      {field.id === "type" && (
                        <Badge variant="outline">
                          {getCollaborationTypeDisplay(collaboration.type)}
                        </Badge>
                      )}
                      {field.id === "responsible" &&
                        (collaboration.responsible || "—")}
                      {field.id === "priority" && (
                        <Badge
                          variant={
                            collaboration.priority === "high"
                              ? "destructive"
                              : collaboration.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {getPriorityDisplay(collaboration.priority)}
                        </Badge>
                      )}
                      {field.id === "successful" && (
                        <Badge
                          variant={
                            collaboration.successful === null
                              ? "secondary"
                              : collaboration.successful
                              ? "default"
                              : "destructive"
                          }
                        >
                          {collaboration.successful === null
                            ? "Unknown"
                            : collaboration.successful
                            ? "Yes"
                            : "No"}
                        </Badge>
                      )}
                      {field.id === "letter" && (
                        <Badge
                          variant={
                            collaboration.letter ? "default" : "secondary"
                          }
                        >
                          {collaboration.letter ? "Yes" : "No"}
                        </Badge>
                      )}
                      {field.id === "meeting" && (
                        <Badge
                          variant={
                            collaboration.meeting === null
                              ? "secondary"
                              : collaboration.meeting
                              ? "default"
                              : "destructive"
                          }
                        >
                          {collaboration.meeting === null
                            ? "Unknown"
                            : collaboration.meeting
                            ? "Yes"
                            : "No"}
                        </Badge>
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
                      {field.id === "contactInFuture" && (
                        <Badge
                          variant={
                            collaboration.contactInFuture === null
                              ? "secondary"
                              : collaboration.contactInFuture
                              ? "default"
                              : "destructive"
                          }
                        >
                          {collaboration.contactInFuture === null
                            ? "Unknown"
                            : collaboration.contactInFuture
                            ? "Yes"
                            : "No"}
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
                      {field.id === "amount" &&
                        formatAmount(
                          collaboration.amount,
                          collaboration.updatedAt
                        )}
                      {field.id === "createdAt" &&
                        formatDate(collaboration.createdAt)}
                      {field.id === "updatedAt" &&
                        formatDate(collaboration.updatedAt)}
                    </TableCell>
                  ))}

                  {(onEdit || onDelete) && (
                    <TableActions
                      item={collaboration}
                      onEdit={onEdit}
                      onDelete={handleDelete}
                    />
                  )}
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
