"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Person } from "@/types/person";
import { type TablePreferences } from "@/types/table";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import {
  updateVisibleColumns,
  handleSort,
  visibleColumnsToStrings,
} from "@/lib/table-utils";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import { PERSON_FIELDS } from "@/config/person-fields";
import { useDebounce } from "@/hooks/use-debounce";
import { PeopleTable } from "./people-table";
import { User } from "lucide-react";

// Default preferences (outside component to prevent recreation)
const defaultPreferences: TablePreferences<Person> = {
  visibleColumns: ["name", "email", "phone", "function", "createdAt"],
  sortField: "name",
  sortDirection: "asc",
};

interface PeopleListProps {
  people: Person[];
  onEdit?: (person: Person) => void;
  onDelete?: (personId: number) => Promise<void>;
  hiddenColumns?: string[];
}

export function PeopleList({
  people,
  onEdit,
  onDelete,
  hiddenColumns = [],
}: PeopleListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Consolidated table preferences state with localStorage
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<Person>
  >(() => {
    // Initialize with saved preferences on first render
    return getTablePreferences("people", defaultPreferences);
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    saveTablePreferences("people", tablePreferences);
  }, [tablePreferences]);

  // Table handler functions
  const handleUpdateVisibleColumns = (newVisibleColumns: string[]) => {
    const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
    setTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  };

  const handleSortColumn = (field: keyof Person) => {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  if (people.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No people found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with count and controls */}
      <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">People</h3>
          <Badge variant="secondary">{people.length}</Badge>
        </div>

        <div className="flex flex-row flex-wrap gap-4 items-center">
          <SearchBar
            placeholder="Search people..."
            onSearchChange={handleSearchChange}
          />

          <ColumnSelector
            fields={PERSON_FIELDS.filter((field) => {
              // Filter out any hidden columns
              if (hiddenColumns.includes(field.id)) return false;
              return true;
            }).map((field) => ({
              id: field.id as string,
              label: field.label,
              required: field.required,
            }))}
            visibleColumns={visibleColumnsToStrings(
              tablePreferences.visibleColumns
            )}
            onColumnsChange={handleUpdateVisibleColumns}
            placeholder="Select columns"
          />
        </div>
      </div>

      {/* People Table */}
      <PeopleTable
        people={people}
        searchQuery={debouncedSearchQuery}
        tablePreferences={tablePreferences}
        onEdit={onEdit}
        onDelete={onDelete}
        onSortColumn={handleSortColumn}
        hiddenColumns={hiddenColumns}
      />
    </div>
  );
}
