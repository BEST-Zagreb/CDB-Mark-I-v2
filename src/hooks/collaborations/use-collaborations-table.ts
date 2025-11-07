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

const collaborationsCompaniesDefaultPreferences: TablePreferences = {
  visibleColumns: [
    "projectName",
    "priority",
    "contactName",
    "status",
    "progress",
    "comment",
    "contactInFuture",
  ],
  sortField: "priority",
  sortDirection: "desc",
};

const collaborationsProjectsDefaultPreferences: TablePreferences = {
  visibleColumns: [
    "companyName",
    "priority",
    "contactName",
    "status",
    "progress",
    "comment",
    "amount",
  ],
  sortField: "priority",
  sortDirection: "desc",
};

const collaborationsUsersDefaultPreferences: TablePreferences = {
  visibleColumns: [
    "projectName",
    "companyName",
    "priority",
    "contactName",
    "status",
    "progress",
    "comment",
  ],
  sortField: "priority",
  sortDirection: "desc",
};

export function useCollaborationsTable(
  storageKey:
    | "collaborations-companies"
    | "collaborations-projects"
    | "collaborations-users",
  hiddenColumns: string[] = [],
  requiredColumns: string[] = []
) {
  const [searchQuery, setSearchQuery] = useState("");

  // Select default preferences based on storage key
  const defaultPreferences =
    storageKey === "collaborations-users"
      ? collaborationsUsersDefaultPreferences
      : storageKey === "collaborations-projects"
      ? collaborationsProjectsDefaultPreferences
      : collaborationsCompaniesDefaultPreferences;

  // Table preferences state for collaborations
  const [tablePreferences, setTablePreferences] = useState(() => {
    const prefs = getTablePreferences(storageKey, defaultPreferences);
    // Ensure requiredColumns are included in visible columns
    const visibleColumnsSet = new Set(prefs.visibleColumns);
    requiredColumns.forEach((col) => visibleColumnsSet.add(col));
    return {
      ...prefs,
      visibleColumns: Array.from(visibleColumnsSet),
    };
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Ensure requiredColumns are always in visibleColumns when they change
  useEffect(() => {
    setTablePreferences((prev) => {
      const visibleColumnsSet = new Set(prev.visibleColumns);
      let hasChanges = false;
      requiredColumns.forEach((col) => {
        if (!visibleColumnsSet.has(col)) {
          visibleColumnsSet.add(col);
          hasChanges = true;
        }
      });
      if (hasChanges) {
        return {
          ...prev,
          visibleColumns: Array.from(visibleColumnsSet),
        };
      }
      return prev;
    });
  }, [requiredColumns]);

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
        // Mark field as required if it's in the original required list OR in requiredColumns
        required: field.required || requiredColumns.includes(field.id),
      })),
    [hiddenColumns, requiredColumns]
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
