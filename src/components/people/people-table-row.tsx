"use client";

import { memo, useCallback } from "react";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/common/table/table-actions";
import { isColumnVisible } from "@/lib/table-utils";
import { formatDate } from "@/lib/format-utils";
import { PERSON_FIELDS } from "@/config/person-fields";
import { Person } from "@/types/person";
import { type TablePreferences } from "@/types/table";

interface PeopleTableRowProps {
  person: Person;
  tablePreferences: TablePreferences<Person>;
  onEdit?: (person: Person) => void;
  onDelete?: (personId: number) => Promise<void>;
  hiddenColumns?: string[];
}

export const PeopleTableRow = memo(function PeopleTableRow({
  person,
  tablePreferences,
  onEdit,
  onDelete,
  hiddenColumns = [],
}: PeopleTableRowProps) {
  const { showDeleteAlert } = useDeleteAlert();

  const handleDelete = useCallback(
    () => {
      if (!onDelete) return;

      showDeleteAlert({
        entity: "person",
        entityName: person.name || "Unknown",
        onConfirm: () => onDelete(person.id),
      });
    },
    [showDeleteAlert, onDelete, person.id, person.name]
  );

  return (
    <TableRow key={person.id}>
      {PERSON_FIELDS.filter(
        (field) => !hiddenColumns.includes(field.id)
      ).map((column) => {
        if (!isColumnVisible(column.id, tablePreferences) && !column.required)
          return null;

        if (column.id === "id") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">#{person.id}</div>
            </TableCell>
          );
        } else if (column.id === "name") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${
                column.center ? "text-center" : "font-medium"
              }`}
            >
              <div className="text-pretty">{person.name || "—"}</div>
            </TableCell>
          );
        } else if (column.id === "email") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">{person.email || "—"}</div>
            </TableCell>
          );
        } else if (column.id === "phone") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">{person.phone || "—"}</div>
            </TableCell>
          );
        } else if (column.id === "function") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              {person.function ? (
                <Badge variant="outline" className="text-pretty">
                  {person.function}
                </Badge>
              ) : (
                <div className="text-pretty">—</div>
              )}
            </TableCell>
          );
        } else if (column.id === "createdAt") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <div className="text-pretty">{formatDate(person.createdAt)}</div>
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
              {String((person as any)[column.id] || "—")}
            </div>
          </TableCell>
        );
      })}

      {/* Actions column */}
      {(onEdit || onDelete) && (
        <TableActions item={person} onEdit={onEdit} onDelete={handleDelete} />
      )}
    </TableRow>
  );
});