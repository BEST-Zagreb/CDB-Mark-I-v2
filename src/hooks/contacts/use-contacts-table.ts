"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";
import type { Contact } from "@/types/contact";

const contactsDefaultPreferences: TablePreferences<Contact> = {
  sortField: "name",
  sortDirection: "asc",
  visibleColumns: ["name", "email", "phone", "function"],
};

export function useContactsTable(storageKey: "contacts" = "contacts") {
  const [searchQuery, setSearchQuery] = useState("");

  // Table preferences state for contacts
  const [tablePreferences, setTablePreferences] = useState(() => {
    return getTablePreferences(storageKey, contactsDefaultPreferences);
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Save table preferences to localStorage
  useEffect(() => {
    saveTablePreferences(storageKey, tablePreferences);
  }, [tablePreferences, storageKey]);

  // Contacts table handlers
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
  const contactFields = useMemo(
    () =>
      CONTACT_FIELDS.map((field) => ({
        id: field.id as string,
        label: field.label,
        required: field.required,
      })),
    []
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
    contactFields,
    visibleColumnsString,
  };
}
