"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/common/table/table-actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isColumnVisible } from "@/lib/table-utils";
import { formatDate, formatAmount } from "@/lib/format-utils";
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
import {
  Collaboration,
  getCollaborationTypeDisplay,
  getPriorityDisplay,
} from "@/types/collaboration";
import { type TablePreferences } from "@/types/table";

interface CollaborationsTableRowProps {
  collaboration: Collaboration & {
    companyName?: string;
    projectName?: string;
    contactName?: string;
  };
  tablePreferences: TablePreferences<
    Collaboration & {
      companyName?: string;
      projectName?: string;
      contactName?: string;
    }
  >;
  onEdit: (collaboration: Collaboration) => void;
  onDeleteConfirm: (collaborationId: number) => Promise<void>;
  hiddenColumns?: string[];
}

export const CollaborationsTableRow = memo(function CollaborationTableRow({
  collaboration,
  tablePreferences,
  onEdit,
  onDeleteConfirm,
  hiddenColumns = [],
}: CollaborationsTableRowProps) {
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  // Memoize the delete handler to prevent recreation
  const handleDelete = useCallback(
    (collaboration: Collaboration) => {
      showDeleteAlert({
        entity: "collaboration",
        entityName: collaboration.responsible || "Unknown",
        onConfirm: () => onDeleteConfirm(collaboration.id),
      });
    },
    [showDeleteAlert, onDeleteConfirm]
  );

  return (
    <TableRow key={collaboration.id}>
      {COLLABORATION_FIELDS.filter(
        (field) => !hiddenColumns.includes(field.id)
      ).map((column) => {
        if (!isColumnVisible(column.id, tablePreferences) && !column.required)
          return null;

        if (column.id === "companyName") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${
                column.center ? "text-center" : "font-medium"
              }`}
            >
              {collaboration.companyName && collaboration.companyId ? (
                <Link
                  href={`/companies/${collaboration.companyId}`}
                  className="text-primary hover:underline text-pretty"
                >
                  {collaboration.companyName}
                </Link>
              ) : (
                <div className="text-pretty">
                  {collaboration.companyName || "—"}
                </div>
              )}
            </TableCell>
          );
        } else if (column.id === "projectName") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${
                column.center ? "text-center" : "font-medium"
              }`}
            >
              {collaboration.projectName && collaboration.projectId ? (
                <Link
                  href={`/projects/${collaboration.projectId}`}
                  className="text-primary hover:underline text-pretty"
                >
                  {collaboration.projectName}
                </Link>
              ) : (
                <div className="text-pretty">
                  {collaboration.projectName || "—"}
                </div>
              )}
            </TableCell>
          );
        } else if (column.id === "type") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <Badge variant="outline">
                {getCollaborationTypeDisplay(collaboration.type)}
              </Badge>
            </TableCell>
          );
        } else if (column.id === "priority") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
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
            </TableCell>
          );
        } else if (column.id === "successful") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
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
            </TableCell>
          );
        } else if (column.id === "letter") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <Badge variant={collaboration.letter ? "default" : "secondary"}>
                {collaboration.letter ? "Yes" : "No"}
              </Badge>
            </TableCell>
          );
        } else if (column.id === "meeting") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
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
            </TableCell>
          );
        } else if (column.id === "contacted") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <Badge
                variant={collaboration.contacted ? "default" : "secondary"}
              >
                {collaboration.contacted ? "Yes" : "No"}
              </Badge>
            </TableCell>
          );
        } else if (column.id === "contactInFuture") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
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
            </TableCell>
          );
        } else if (column.id === "comment") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate">{collaboration.comment}</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs font-medium whitespace-pre-wrap p-1">
                      {collaboration.comment}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
          );
        } else if (column.id === "amount") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">
                {formatAmount(collaboration.amount, collaboration.updatedAt)}
              </div>
            </TableCell>
          );
        } else if (column.id === "createdAt") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">
                {formatDate(collaboration.createdAt)}
              </div>
            </TableCell>
          );
        } else if (column.id === "updatedAt") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">
                {formatDate(collaboration.updatedAt)}
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
            <div className="text-pretty">
              {(collaboration as any)[column.id] || "—"}
            </div>
          </TableCell>
        );
      })}

      {/* Actions - Always visible */}
      <TableActions
        item={collaboration}
        onEdit={onEdit}
        onDelete={handleDelete}
      />
    </TableRow>
  );
});
