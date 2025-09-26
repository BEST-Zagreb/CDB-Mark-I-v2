import { ReactElement } from "react";
import { ChevronsUpDown, ChevronDown, ChevronUp } from "lucide-react";
import type { TablePreferences } from "@/types/table";

// Helper function to check if a column is visible
export function isColumnVisible(
  columnId: string,
  tablePreferences: TablePreferences
): boolean {
  return tablePreferences.visibleColumns.includes(columnId);
}

// Simple function that returns filtered visible columns
export function updateVisibleColumns(
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
export function handleSort(
  currentPreferences: TablePreferences,
  field: string
): TablePreferences {
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
export function getSortIcon(
  field: string,
  tablePreferences: TablePreferences
): ReactElement {
  if (tablePreferences.sortField !== field) {
    return <ChevronsUpDown className="size-4" />;
  }
  return tablePreferences.sortDirection === "asc" ? (
    <ChevronUp className="size-4" />
  ) : (
    <ChevronDown className="size-4" />
  );
}
