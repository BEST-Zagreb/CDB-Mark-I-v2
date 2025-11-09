"use client";

import { memo, useCallback } from "react";
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
import {
  Phone,
  Mail,
  Briefcase,
  BadgeHelp,
  BadgeEuro,
  BadgeX,
  ShieldAlert,
  ClockAlert,
} from "lucide-react";
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
import { Collaboration } from "@/types/collaboration";
import { formatDate, formatCurrency } from "@/lib/format-utils";
import { type TablePreferences } from "@/types/table";

interface CollaborationsTableRowProps {
  collaboration: Collaboration & {
    companyName?: string;
    projectName?: string;
    contactName?: string;
  };
  tablePreferences: TablePreferences;
  onEdit: (collaboration: Collaboration) => void;
  onDeleteConfirm: (collaborationId: number) => Promise<void>;
  hiddenColumns?: string[];
  currentUserName?: string;
}

export const CollaborationsTableRow = memo(function CollaborationTableRow({
  collaboration,
  tablePreferences,
  onEdit,
  onDeleteConfirm,
  hiddenColumns = [],
  currentUserName,
}: CollaborationsTableRowProps) {
  const { showDeleteAlert } = useDeleteAlert();

  // Check if the current user can edit/delete this collaboration
  // User can edit if they're the responsible person, or if no currentUserName is passed (admin view)
  const canEdit =
    !currentUserName || collaboration.responsible === currentUserName;

  // Memoize the delete handler to prevent recreation
  const handleDelete = useCallback(
    (
      collaboration: Collaboration & {
        companyName?: string;
        projectName?: string;
      }
    ) => {
      const companyText = collaboration.companyName || "Unknown Company";
      const projectText = collaboration.projectName || "Unknown Project";
      showDeleteAlert({
        entityType: "collaboration",
        entityDescription: `collaboration with "${companyText}" on "${projectText}"`,
        onConfirm: () => onDeleteConfirm(collaboration.id),
      });
    },
    [showDeleteAlert, onDeleteConfirm]
  );

  return (
    <TableRow
      key={collaboration.id}
      className={
        collaboration.contactInFuture === false
          ? "bg-orange-50 text-muted-foreground"
          : ""
      }
    >
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
              <div className="flex items-center gap-2">
                {collaboration.companyHasDoNotContact && (
                  <ShieldAlert className="size-5 text-orange-900 flex-shrink-0" />
                )}
                {collaboration.companyName && collaboration.companyId ? (
                  <Link
                    href={`/companies/${collaboration.companyId}`}
                    className="text-primary hover:underline text-pretty"
                  >
                    {collaboration.companyName}
                  </Link>
                ) : (
                  <div className="text-pretty">
                    {collaboration.companyName || "-"}
                  </div>
                )}
              </div>
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
                  {collaboration.projectName || "-"}
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
                {collaboration.type || "Unknown/Not specified"}
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
                  collaboration.priority === "High"
                    ? "destructive"
                    : collaboration.priority === "Medium"
                    ? "default"
                    : "secondary"
                }
              >
                {collaboration.priority}
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
        } else if (column.id === "status") {
          // Inline status label and color logic
          const statusLabel =
            collaboration.successful === true
              ? "Successful"
              : collaboration.successful === false
              ? "Rejected"
              : "Pending";
          const statusColor =
            collaboration.successful === true
              ? "text-green-600"
              : collaboration.successful === false
              ? "text-red-600"
              : "text-yellow-600";
          const StatusIcon =
            collaboration.successful === true
              ? BadgeEuro
              : collaboration.successful === false
              ? BadgeX
              : BadgeHelp;

          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center && "text-center"}`}
            >
              <div className="flex items-center justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <StatusIcon className={`size-5 ${statusColor}`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{statusLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          );
        } else if (column.id === "progress") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center && "text-center"}`}
            >
              <div className="flex items-center justify-center gap-1">
                {collaboration.contacted && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Phone className="size-4 text-blue-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Contacted</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {collaboration.letter && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Mail className="size-4 text-orange-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Letter Sent</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {collaboration.meeting && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Briefcase className="size-4 text-purple-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Meeting Held</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                {!collaboration.contacted &&
                  !collaboration.letter &&
                  !collaboration.meeting && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ClockAlert className="size-4 text-red-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Not contacted yet</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>
            </TableCell>
          );
        } else if (column.id === "comment") {
          return (
            <TableCell
              key={column.id}
              className={`${column.center ? "text-center" : ""}`}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate w-max max-w-50">
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
            </TableCell>
          );
        } else if (column.id === "responsible") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              {collaboration.responsible && collaboration.responsibleUserId ? (
                <Link
                  href={`/users/${collaboration.responsibleUserId}`}
                  className="text-primary hover:underline text-pretty"
                >
                  {collaboration.responsible}
                </Link>
              ) : (
                <div className="text-pretty">
                  {collaboration.responsible || "-"}
                </div>
              )}
            </TableCell>
          );
        } else if (column.id === "amount") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">
                {formatCurrency(
                  collaboration.amount || 0,
                  collaboration.updatedAt || collaboration.createdAt
                )}
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
              {String(
                (collaboration as unknown as Record<string, unknown>)[
                  column.id
                ] || "-"
              )}
            </div>
          </TableCell>
        );
      })}

      {/* Actions - Always visible */}
      <TableActions
        item={collaboration}
        onEdit={canEdit ? onEdit : undefined}
        onDelete={canEdit ? handleDelete : undefined}
      />
    </TableRow>
  );
});
