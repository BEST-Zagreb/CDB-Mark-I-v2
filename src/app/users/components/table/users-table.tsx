"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { type TablePreferences } from "@/types/table";
import { isColumnVisible, getSortIcon } from "@/lib/table-utils";
import { USER_FIELDS } from "@/config/user-fields";
import { UsersTableRow } from "@/app/users/components/table/users-table-row";

interface UsersTableProps {
  users: User[];
  searchQuery: string;
  tablePreferences: TablePreferences;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => Promise<void>;
  onSortColumn: (field: keyof User) => void;
}

export function UsersTable({
  users,
  searchQuery,
  tablePreferences,
  onEdit,
  onDelete,
  onSortColumn,
}: UsersTableProps) {
  // Filter and sort users based on search query and preferences
  const filteredAndSortedUsers = useMemo(() => {
    // Filter by search query
    let filtered = users;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Sort users
    return [...filtered].sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      const { sortField, sortDirection } = tablePreferences;

      // Handle different field types
      switch (sortField) {
        case "id":
          aValue = a[sortField];
          bValue = b[sortField];
          break;
        case "fullName":
        case "email":
        case "role":
        case "description":
          aValue = a[sortField];
          bValue = b[sortField];
          break;
        case "createdAt":
        case "updatedAt":
          // Convert dates to timestamps for comparison
          aValue = a[sortField] ? new Date(a[sortField]).getTime() : null;
          bValue = b[sortField] ? new Date(b[sortField]).getTime() : null;
          break;
        case "isLocked":
          aValue = a[sortField] ? "locked" : "unlocked";
          bValue = b[sortField] ? "locked" : "unlocked";
          break;
        case "lastLogin":
          // Convert dates to timestamps for comparison
          aValue = a[sortField] ? new Date(a[sortField]).getTime() : null;
          bValue = b[sortField] ? new Date(b[sortField]).getTime() : null;
          break;
        default:
          aValue = a[sortField as keyof User] as string | number | null;
          bValue = b[sortField as keyof User] as string | number | null;
      }

      // Handle null/undefined values
      const aIsEmpty =
        aValue == null || (typeof aValue === "string" && aValue.trim() === "");
      const bIsEmpty =
        bValue == null || (typeof bValue === "string" && bValue.trim() === "");

      if (aIsEmpty && bIsEmpty) return 0;
      if (aIsEmpty) return 1;
      if (bIsEmpty) return -1;

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
  }, [users, searchQuery, tablePreferences]);

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found
      </div>
    );
  }

  if (filteredAndSortedUsers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found matching &quot;{searchQuery}&quot;
      </div>
    );
  }

  return (
    <div className="rounded-sm border bg-zinc-50 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-100">
          <TableRow>
            {USER_FIELDS.map((column) => {
              if (!isColumnVisible(column.id, tablePreferences)) return null;

              return (
                <TableHead
                  key={column.id}
                  className={column.center ? "text-center" : ""}
                >
                  <Button
                    variant="ghost"
                    onClick={() => onSortColumn(column.id as keyof User)}
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
                </TableHead>
              );
            })}
            <TableHead className="text-center font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredAndSortedUsers.map((user) => (
            <UsersTableRow
              key={user.id}
              user={user}
              tablePreferences={tablePreferences}
              onEdit={onEdit}
              onDeleteConfirm={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
