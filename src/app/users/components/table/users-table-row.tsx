"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { TableCell, TableRow } from "@/components/ui/table";
import { TableActions } from "@/components/common/table/table-actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isColumnVisible } from "@/lib/table-utils";
import { formatDate } from "@/lib/format-utils";
import { USER_FIELDS } from "@/config/user-fields";
import { User } from "@/types/user";
import { type TablePreferences } from "@/types/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface UsersTableRowProps {
  user: User;
  tablePreferences: TablePreferences;
  onEdit?: (user: User) => void;
  onDeleteConfirm?: (userId: string) => Promise<void>;
}

export const UsersTableRow = memo(function UsersTableRow({
  user,
  tablePreferences,
  onEdit,
  onDeleteConfirm,
}: UsersTableRowProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();
  const addedById = user.addedByUser?.id ?? user.addedBy ?? null;
  const addedByName =
    user.addedByUser?.fullName?.trim() ||
    user.addedByUser?.email?.trim() ||
    user.addedBy ||
    null;

  // Memoize the view handler to prevent recreation
  const handleView = useCallback(
    (user: User) => router.push(`/users/${user.id}`),
    [router]
  );

  // Memoize the delete handler to prevent recreation
  const handleDelete = useCallback(
    (user: User) => {
      if (!onDeleteConfirm) return;
      showDeleteAlert({
        entityType: "user",
        entityDescription: `user "${user.fullName}"`,
        onConfirm: () => onDeleteConfirm(user.id),
      });
    },
    [showDeleteAlert, onDeleteConfirm]
  );

  return (
    <TableRow key={user.id}>
      {isColumnVisible("id", tablePreferences) && (
        <TableCell className="text-center">
          <div className="text-pretty">{user.id}</div>
        </TableCell>
      )}

      {isColumnVisible("fullName", tablePreferences) && (
        <TableCell className="max-w-50 font-medium">
          <Link
            href={`/users/${user.id}`}
            className="text-primary hover:underline text-pretty"
          >
            {user.fullName || "-"}
          </Link>
        </TableCell>
      )}

      {isColumnVisible("email", tablePreferences) && (
        <TableCell className="max-w-50">
          <div className="text-pretty">{user.email || "-"}</div>
        </TableCell>
      )}

      {isColumnVisible("role", tablePreferences) && (
        <TableCell className="max-w-50">
          <div className="text-pretty">{user.role || "-"}</div>
        </TableCell>
      )}

      {isColumnVisible("description", tablePreferences) && (
        <TableCell className="max-w-50">
          {user.description ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate">{user.description}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs font-medium whitespace-pre-wrap p-1">
                    {user.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            "-"
          )}
        </TableCell>
      )}

      {isColumnVisible("addedBy", tablePreferences) && (
        <TableCell className="max-w-50">
          {addedById ? (
            <Link
              href={`/users/${addedById}`}
              className="text-primary hover:underline text-pretty"
            >
              {addedByName || "-"}
            </Link>
          ) : (
            <div className="text-pretty">{addedByName || "-"}</div>
          )}
        </TableCell>
      )}

      {isColumnVisible("isLocked", tablePreferences) && (
        <TableCell className="max-w-50 text-center">
          {user.isLocked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-4 w-4 text-primary inline-block" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Account is locked</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </TableCell>
      )}

      {isColumnVisible("lastLogin", tablePreferences) && (
        <TableCell className="max-w-50 text-center">
          <div className="text-pretty">
            {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
          </div>
        </TableCell>
      )}

      {isColumnVisible("createdAt", tablePreferences) && (
        <TableCell className="max-w-50 text-center">
          <div className="text-pretty">{formatDate(user.createdAt)}</div>
        </TableCell>
      )}

      {isColumnVisible("updatedAt", tablePreferences) && (
        <TableCell className="max-w-50 text-center">
          <div className="text-pretty">{formatDate(user.updatedAt)}</div>
        </TableCell>
      )}

      {/* Actions - Always visible */}
      <TableActions
        item={user}
        onView={isMobile ? undefined : handleView}
        onEdit={onEdit}
        onDelete={onDeleteConfirm ? handleDelete : undefined}
      />
    </TableRow>
  );
});
