// Types for table functionality
export type SortDirection = "asc" | "desc";

export interface TablePreferences<T = any> {
  visibleColumns: string[];
  sortField: string;
  sortDirection: SortDirection;
}

// Generic table column configuration
export interface TableColumn<T> {
  id: keyof T;
  label: string;
  required: boolean;
  sortable?: boolean;
}

// Table action handlers interface
export interface TableActions<T> {
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}
