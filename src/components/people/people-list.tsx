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
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { Person } from "@/types/person";
import { type TablePreferences } from "@/types/table";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Building2,
} from "lucide-react";
import { TableActions } from "@/components/table-actions";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  isColumnVisible,
  updateVisibleColumns,
  handleSort,
  getSortIcon,
  visibleColumnsToStrings,
} from "@/lib/table-utils";
import { formatDate } from "@/lib/format-utils";

// Define available columns for the table using Person type
const PERSON_FIELDS: Array<{
  id: keyof Person;
  label: string;
  required: boolean;
  sortable: boolean;
  center: boolean;
}> = [
  { id: "id", label: "ID", required: false, sortable: true, center: true },
  { id: "name", label: "Name", required: true, sortable: true, center: false },
  {
    id: "email",
    label: "Email",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "phone",
    label: "Phone",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "function",
    label: "Function",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "companyName",
    label: "Company",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "createdAt",
    label: "Created",
    required: false,
    sortable: true,
    center: false,
  },
];

interface PeopleListProps {
  people: Person[];
  onEdit?: (person: Person) => void;
  onDelete?: (personId: number) => Promise<void>;
}

export function PeopleList({ people, onEdit, onDelete }: PeopleListProps) {
  const { showDeleteAlert } = useDeleteAlert();

  // Consolidated table preferences state
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<Person>
  >({
    visibleColumns: ["name", "email", "phone", "function"], // Default visible columns
    sortField: "name", // Default sort field
    sortDirection: "asc", // Default sort direction
  });

  function handleUpdateVisibleColumns(newVisibleColumns: string[]) {
    const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
    setTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  }

  function handleSortColumn(field: keyof Person) {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  }

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

  function handleDelete(person: Person) {
    if (onDelete) {
      showDeleteAlert({
        entity: "person",
        entityName: person.name || "Nepoznato",
        onConfirm: () => onDelete(person.id),
      });
    }
  }

  if (people.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No people found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold">People</h2>
          <Badge variant="secondary">{people.length}</Badge>
        </div>
        <ColumnSelector
          fields={PERSON_FIELDS.map((field) => ({
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
              {PERSON_FIELDS.filter((field) =>
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
              {(onEdit || onDelete) && (
                <TableHead className="text-center w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPeople.map((person: Person) => (
              <TableRow key={person.id}>
                {PERSON_FIELDS.filter((field) =>
                  isColumnVisible(field.id, tablePreferences)
                ).map((field) => (
                  <TableCell
                    key={field.id}
                    className={field.center ? "text-center" : ""}
                  >
                    {field.id === "id" && person.id}
                    {field.id === "name" && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {person.name || "—"}
                        </span>
                      </div>
                    )}
                    {field.id === "email" &&
                      (person.email ? (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{person.email}</span>
                        </div>
                      ) : (
                        "—"
                      ))}
                    {field.id === "phone" &&
                      (person.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{person.phone}</span>
                        </div>
                      ) : (
                        "—"
                      ))}
                    {field.id === "function" &&
                      (person.function ? (
                        <Badge variant="outline">{person.function}</Badge>
                      ) : (
                        "—"
                      ))}
                    {field.id === "companyName" &&
                      (person.companyName ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{person.companyName}</span>
                        </div>
                      ) : (
                        "—"
                      ))}
                    {field.id === "createdAt" && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(person.createdAt)}
                      </div>
                    )}
                  </TableCell>
                ))}

                {(onEdit || onDelete) && (
                  <TableActions
                    item={person}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                  />
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
