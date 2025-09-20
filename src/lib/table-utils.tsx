import { Dispatch, SetStateAction, ReactElement } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Company } from "@/types/company";
import type { TablePreferences, SortDirection } from "@/types/table";

// Helper function to check if a column is visible
export function isColumnVisible<T>(
  columnId: keyof T,
  tablePreferences: TablePreferences<T>
): boolean {
  return tablePreferences.visibleColumns.includes(columnId);
}

// Simple function that returns filtered visible columns
export function updateVisibleColumns<T>(
  newVisibleColumns: string[],
  requiredColumn?: keyof T
): (keyof T)[] {
  // Ensure required column is always included if specified
  const columnsWithRequired = [requiredColumn as string, ...newVisibleColumns];

  return columnsWithRequired as (keyof T)[];
}

// Helper to convert keyof T[] to string[] for MultiSelect component
export function visibleColumnsToStrings<T>(
  visibleColumns: (keyof T)[]
): string[] {
  return visibleColumns.map((col) => col as string);
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

// Format URL utility function
export function formatUrl(url: string): { label: string; link: string } | null {
  if (!url || url === "null" || url === "") return null;

  let label = url;
  let link = url;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    // If URL contains http or https, keep the link same but remove protocol from label
    link = url;
    label = url.replace(/^https?:\/\//, "");
  } else {
    // If URL doesn't contain http/https, add https:// to link but keep original as label
    label = url;
    link = `https://${url}`;
  }

  return { label, link };
}
