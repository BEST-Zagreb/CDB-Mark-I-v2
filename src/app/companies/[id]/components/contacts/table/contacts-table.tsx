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
import { Contact } from "@/types/contact";
import { type TablePreferences } from "@/types/table";
import { isColumnVisible, getSortIcon } from "@/lib/table-utils";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { ContactsTableRow } from "@/app/companies/[id]/components/contacts/table/contacts-table-row";

interface ContactsTableProps {
  contacts: Contact[];
  searchQuery: string;
  tablePreferences: TablePreferences;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contactId: number) => Promise<void>;
  onSortColumn: (field: string) => void;
  hiddenColumns?: string[];
}

export function ContactsTable({
  contacts,
  searchQuery,
  tablePreferences,
  onEdit,
  onDelete,
  onSortColumn,
  hiddenColumns = [],
}: ContactsTableProps) {
  // Sort contacts based on current sort field and direction
  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      const { sortField, sortDirection } = tablePreferences;

      // Handle different field types
      switch (sortField) {
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "createdAt":
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : null;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : null;
          break;
        default:
          // For string fields, convert to lowercase for case-insensitive sorting
          aValue = a[sortField as keyof Contact] as string | number | null;
          bValue = b[sortField as keyof Contact] as string | number | null;
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

      // Both values are valid, compare normally
      if (aValue! < bValue!) return sortDirection === "asc" ? -1 : 1;
      if (aValue! > bValue!) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [contacts, tablePreferences.sortField, tablePreferences.sortDirection]);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return sortedContacts;

    const query = searchQuery.toLowerCase();
    return sortedContacts.filter((contact) => {
      return (
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        contact.function?.toLowerCase().includes(query)
      );
    });
  }, [sortedContacts, searchQuery]);

  // Filter out hidden columns
  const visibleColumnsFields = CONTACT_FIELDS.filter(
    (field) => !hiddenColumns.includes(field.id)
  );

  if (filteredContacts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery
          ? `No contacts found matching "${searchQuery}"`
          : "No contacts found"}
      </div>
    );
  }

  return (
    <div className="rounded-sm border bg-zinc-50 overflow-hidden overflow-hidden">
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
            {/* Actions - Always visible if handlers provided */}
            {(onEdit || onDelete) && (
              <TableHead className="text-center font-bold">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredContacts.map((contact) => (
            <ContactsTableRow
              key={contact.id}
              contact={contact}
              tablePreferences={tablePreferences}
              onEdit={onEdit}
              onDelete={onDelete}
              hiddenColumns={hiddenColumns}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
