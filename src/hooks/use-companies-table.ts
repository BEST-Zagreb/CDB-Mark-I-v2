"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { COMPANY_FIELDS } from "@/config/company-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";
import type { Company } from "@/types/company";

// Default preferences (outside hook to prevent recreation)
const defaultPreferences: TablePreferences<Company> = {
  visibleColumns: ["name", "url", "budgeting_month", "city", "comment"],
  sortField: "name",
  sortDirection: "asc",
};

export function useCompaniesTable() {
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<Company>
  >(() => {
    return getTablePreferences("companies", defaultPreferences);
  });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    saveTablePreferences("companies", tablePreferences);
  }, [tablePreferences]);

  // Memoize column selector handler
  const handleUpdateVisibleColumns = useCallback(
    (newVisibleColumns: string[]) => {
      const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
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
      COMPANY_FIELDS.map((field) => ({
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
