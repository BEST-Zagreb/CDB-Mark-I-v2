"use client";

import { memo, useCallback } from "react";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableActions } from "@/components/common/table/table-actions";
import { isColumnVisible } from "@/lib/table-utils";
import { formatDate } from "@/lib/format-utils";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { Contact } from "@/types/contact";
import { type TablePreferences } from "@/types/table";

interface ContactsTableRowProps {
  contact: Contact;
  tablePreferences: TablePreferences;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: number) => Promise<void>;
  hiddenColumns?: string[];
}

export const ContactsTableRow = memo(function ContactsTableRow({
  contact,
  tablePreferences,
  onEdit,
  onDelete,
  hiddenColumns = [],
}: ContactsTableRowProps) {
  const { showDeleteAlert } = useDeleteAlert();

  const handleDelete = useCallback(() => {
    if (!onDelete) return;

    showDeleteAlert({
      entity: "contact",
      entityName: contact.name || "Unknown",
      onConfirm: () => onDelete(contact.id),
    });
  }, [showDeleteAlert, onDelete, contact.id, contact.name]);

  return (
    <TableRow key={contact.id}>
      {CONTACT_FIELDS.filter((field) => !hiddenColumns.includes(field.id)).map(
        (column) => {
          if (!isColumnVisible(column.id, tablePreferences) && !column.required)
            return null;

          if (column.id === "id") {
            return (
              <TableCell
                key={column.id}
                className={`max-w-50 ${column.center ? "text-center" : ""}`}
              >
                <div className="text-pretty">#{contact.id}</div>
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
                <div className="text-pretty">{contact.name || "—"}</div>
              </TableCell>
            );
          } else if (column.id === "email") {
            return (
              <TableCell
                key={column.id}
                className={`max-w-50 ${column.center ? "text-center" : ""}`}
              >
                <div className="text-pretty">{contact.email || "—"}</div>
              </TableCell>
            );
          } else if (column.id === "phone") {
            return (
              <TableCell
                key={column.id}
                className={`max-w-50 ${column.center ? "text-center" : ""}`}
              >
                <div className="text-pretty">{contact.phone || "—"}</div>
              </TableCell>
            );
          } else if (column.id === "function") {
            return (
              <TableCell
                key={column.id}
                className={`max-w-50 ${column.center ? "text-center" : ""}`}
              >
                {contact.function ? (
                  <Badge variant="default" className="text-xs">
                    {contact.function}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
            );
          } else if (column.id === "createdAt") {
            return (
              <TableCell
                key={column.id}
                className={`max-w-50 ${column.center ? "text-center" : ""}`}
              >
                <div className="text-pretty">
                  {formatDate(contact.createdAt)}
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
                {String(contact[column.id as keyof Contact] || "—")}
              </div>
            </TableCell>
          );
        }
      )}

      {/* Actions column */}
      {(onEdit || onDelete) && (
        <TableActions item={contact} onEdit={onEdit} onDelete={handleDelete} />
      )}
    </TableRow>
  );
});
