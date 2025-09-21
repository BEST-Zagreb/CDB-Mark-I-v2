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
import { Person } from "@/types/person";
import { type TablePreferences } from "@/types/table";
import { isColumnVisible, getSortIcon } from "@/lib/table-utils";
import { PERSON_FIELDS } from "@/config/person-fields";
import { PeopleTableRow } from "./people-table-row";

interface PeopleTableProps {
  people: Person[];
  searchQuery: string;
  tablePreferences: TablePreferences<Person>;
  onEdit?: (person: Person) => void;
  onDelete?: (personId: number) => Promise<void>;
  onSortColumn: (field: keyof Person) => void;
  hiddenColumns?: string[];
}

export function PeopleTable({
  people,
  searchQuery,
  tablePreferences,
  onEdit,
  onDelete,
  onSortColumn,
  hiddenColumns = [],
}: PeopleTableProps) {
  // Sort people based on current sort field and direction
  const sortedPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const { sortField, sortDirection } = tablePreferences;

      // Handle different field types
      switch (sortField) {
        case "id":
          aValue = a.id || 0;
          bValue = b.id || 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          // For string fields, convert to lowercase for case-insensitive sorting
          aValue = String(a[sortField] || "").toLowerCase();
          bValue = String(b[sortField] || "").toLowerCase();
          break;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [people, tablePreferences.sortField, tablePreferences.sortDirection]);

  // Filter people based on search query
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return sortedPeople;

    const query = searchQuery.toLowerCase();
    return sortedPeople.filter((person) => {
      return (
        person.name?.toLowerCase().includes(query) ||
        person.email?.toLowerCase().includes(query) ||
        person.phone?.toLowerCase().includes(query) ||
        person.function?.toLowerCase().includes(query)
      );
    });
  }, [sortedPeople, searchQuery]);

  // Filter out hidden columns
  const visibleColumnsFields = PERSON_FIELDS.filter(
    (field) => !hiddenColumns.includes(field.id)
  );

  if (filteredPeople.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery
          ? `No people found matching "${searchQuery}"`
          : "No people found. Add a person to get started."}
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
          {filteredPeople.map((person) => (
            <PeopleTableRow
              key={person.id}
              person={person}
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
