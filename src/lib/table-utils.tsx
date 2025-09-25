import { Dispatch, SetStateAction, ReactElement } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Company } from "@/types/company";
import type { TablePreferences, SortDirection } from "@/types/table";

// Helper function to check if a column is visible
export function isColumnVisible<T>(
  columnId: string,
  tablePreferences: TablePreferences<T>
): boolean {
  return tablePreferences.visibleColumns.includes(columnId);
}

// Simple function that returns filtered visible columns
export function updateVisibleColumns<T>(
  newVisibleColumns: string[],
  requiredColumn?: string
): string[] {
  // Ensure required column is always included if specified
  const columnsWithRequired = requiredColumn
    ? [requiredColumn, ...newVisibleColumns]
    : newVisibleColumns;

  return columnsWithRequired;
}

// Helper to convert string[] to string[] for MultiSelect component (no-op now)
export function visibleColumnsToStrings(visibleColumns: string[]): string[] {
  return visibleColumns;
}

// Simple function that returns updated table preferences for sorting
export function handleSort<T>(
  currentPreferences: TablePreferences<T>,
  field: keyof T
): TablePreferences<T> {
  if (currentPreferences.sortField === field) {
    // Toggle direction if same field
    return {
      ...currentPreferences,
      sortDirection:
        currentPreferences.sortDirection === "asc" ? "desc" : "asc",
    };
  } else {
    // Set new field with ascending direction
    return {
      ...currentPreferences,
      sortField: field,
      sortDirection: "asc",
    };
  }
}

// Get sort icon JSX element
export function getSortIcon<T>(
  field: keyof T,
  tablePreferences: TablePreferences<T>
): ReactElement {
  if (tablePreferences.sortField !== field) {
    return <ArrowUpDown className="h-4 w-4" />;
  }
  return tablePreferences.sortDirection === "asc" ? (
    <ArrowUp className="h-4 w-4" />
  ) : (
    <ArrowDown className="h-4 w-4" />
  );
}
