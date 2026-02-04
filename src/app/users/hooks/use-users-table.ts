"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { USER_FIELDS, DEFAULT_USER_COLUMNS } from "@/config/user-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";

// Default preferences (outside hook to prevent recreation)
const defaultPreferences: TablePreferences = {
  visibleColumns: [...DEFAULT_USER_COLUMNS],
  sortField: "fullName",
  sortDirection: "asc",
};

export function useUsersTable() {
  // Start with defaults to ensure SSR and first client render match.
  const [tablePreferences, setTablePreferences] = useState<TablePreferences>(
    defaultPreferences
  );
  const [preferencesInitialized, setPreferencesInitialized] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load preferences from localStorage after mount to avoid hydration mismatches.
  useEffect(() => {
    setTablePreferences(getTablePreferences("users", defaultPreferences));
    setPreferencesInitialized(true);
  }, []);

  // Save preferences to localStorage whenever they change (after initialization).
  useEffect(() => {
    if (!preferencesInitialized) return;
    saveTablePreferences("users", tablePreferences);
  }, [preferencesInitialized, tablePreferences]);

  // Memoize column selector handler
  const handleUpdateVisibleColumns = useCallback(
    (newVisibleColumns: string[]) => {
      const visibleColumns = updateVisibleColumns(
        newVisibleColumns,
        "fullName"
      );
      setTablePreferences((prev) => ({
        ...prev,
        visibleColumns: visibleColumns,
      }));
    },
    []
  );

  // Handle sorting functionality
  const handleSortColumn = useCallback(
    (field: string) => {
      const newPreferences = handleSort(tablePreferences, field);
      setTablePreferences(newPreferences);
    },
    [tablePreferences]
  );

  // Memoize column selector fields to prevent recreation
  const columnSelectorFields = useMemo(
    () =>
      USER_FIELDS.map((field) => ({
        id: field.id,
        label: field.label,
        required: field.required,
      })),
    []
  );

  // Memoize visible columns to prevent recreation
  const visibleColumnsString = useMemo(
    () => visibleColumnsToStrings(tablePreferences.visibleColumns),
    [tablePreferences.visibleColumns]
  );

  // Handle search query updates
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return {
    tablePreferences,
    searchQuery: debouncedSearchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    columnSelectorFields,
    visibleColumnsString,
  };
}
