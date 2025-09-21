import { type TablePreferences } from "@/types/table";

// Main localStorage key for the entire application
const APP_STORAGE_KEY = "Company_Database_app";

// Table type identifiers
export type TableType =
  | "projects"
  | "companies"
  | "people"
  | "collaborations-companies"
  | "collaborations-projects";

// Structure for all table preferences
interface AppTablePreferences {
  projects?: TablePreferences<any>;
  companies?: TablePreferences<any>;
  people?: TablePreferences<any>;
  "collaborations-companies"?: TablePreferences<any>;
  "collaborations-projects"?: TablePreferences<any>;
}

/**
 * Get all table preferences from localStorage
 */
function getAllTablePreferences(): AppTablePreferences {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(APP_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn("Failed to parse table preferences from localStorage:", error);
    return {};
  }
}

/**
 * Save all table preferences to localStorage
 */
function saveAllTablePreferences(preferences: AppTablePreferences): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn("Failed to save table preferences to localStorage:", error);
  }
}

/**
 * Get table preferences for a specific table type
 */
export function getTablePreferences<T>(
  tableType: TableType,
  defaultPreferences: TablePreferences<T>
): TablePreferences<T> {
  const allPreferences = getAllTablePreferences();
  const tablePreferences = allPreferences[tableType];

  if (!tablePreferences) {
    return defaultPreferences;
  }

  // Merge with defaults to ensure all required properties exist
  return {
    ...defaultPreferences,
    ...tablePreferences,
  } as TablePreferences<T>;
}

/**
 * Save table preferences for a specific table type
 */
export function saveTablePreferences<T>(
  tableType: TableType,
  preferences: TablePreferences<T>
): void {
  const allPreferences = getAllTablePreferences();
  allPreferences[tableType] = preferences;
  saveAllTablePreferences(allPreferences);
}

/**
 * Clear all table preferences (useful for testing or reset functionality)
 */
export function clearAllTablePreferences(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(APP_STORAGE_KEY);
}

/**
 * Clear preferences for a specific table type
 */
export function clearTablePreferences(tableType: TableType): void {
  const allPreferences = getAllTablePreferences();
  delete allPreferences[tableType];
  saveAllTablePreferences(allPreferences);
}
