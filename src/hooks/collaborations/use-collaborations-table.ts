"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";
import type { Collaboration } from "@/types/collaboration";

const collaborationsDefaultPreferences: TablePreferences<
  Collaboration & {
    companyName?: string;
    projectName?: string;
    contactName?: string;
  }
> = {
  visibleColumns: [
    "projectName",
    "responsible",
    "priority",
    "contactName",
    "comment",
  ],
  sortField: "priority",
  sortDirection: "desc",
};

export function useCollaborationsTable(
  storageKey:
    | "collaborations-companies"
    | "collaborations-projects" = "collaborations-companies",
  hiddenColumns: string[] = []
) {
  const [searchQuery, setSearchQuery] = useState("");

  // Table preferences state for collaborations
  const [tablePreferences, setTablePreferences] = useState(() => {
    return getTablePreferences(storageKey, collaborationsDefaultPreferences);
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Save table preferences to localStorage
  useEffect(() => {
    saveTablePreferences(storageKey, tablePreferences);
  }, [tablePreferences, storageKey]);

  // Collaborations table handlers
  const handleUpdateVisibleColumns = useCallback(
    (newVisibleColumns: string[]) => {
      const visibleColumns = updateVisibleColumns(
        newVisibleColumns,
        "projectName"
      );
      setTablePreferences((prev) => ({
        ...prev,
        visibleColumns: visibleColumns,
      }));
    },
    []
  );

  const handleSortColumn = useCallback(
    (field: string) => {
      const newPreferences = handleSort(tablePreferences, field);
      setTablePreferences(newPreferences);
    },
    [tablePreferences]
  );

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Memoized column configurations
  const collaborationFields = useMemo(
    () =>
      COLLABORATION_FIELDS.filter((field) => {
        // Filter out columns that should be hidden
        if (hiddenColumns.includes(field.id)) return false;
        return true;
      }).map((field) => ({
        id: field.id as string,
        label: field.label,
        required: field.required,
      })),
    [hiddenColumns]
  );

  const visibleColumnsString = useMemo(
    () => visibleColumnsToStrings(tablePreferences.visibleColumns),
    [tablePreferences.visibleColumns]
  );

  return {
    tablePreferences,
    searchQuery: debouncedSearchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    collaborationFields,
    visibleColumnsString,
  };
}
