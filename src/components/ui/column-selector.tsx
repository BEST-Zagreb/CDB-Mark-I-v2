"use client";

import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
} from "@/components/ui/multi-select";
import { Settings } from "lucide-react";

interface ColumnField {
  id: string;
  label: string;
  required: boolean;
}

interface ColumnSelectorProps {
  fields: ColumnField[];
  visibleColumns: string[];
  onColumnsChange: (newVisibleColumns: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ColumnSelector({
  fields,
  visibleColumns,
  onColumnsChange,
  placeholder = "Select columns",
  className = "",
}: ColumnSelectorProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Columns:</span>
        <MultiSelect values={visibleColumns} onValuesChange={onColumnsChange}>
          <MultiSelectTrigger className="min-w-[200px]">
            <MultiSelectValue placeholder={placeholder} />
          </MultiSelectTrigger>
          <MultiSelectContent>
            {fields.map((column) => (
              <MultiSelectItem
                key={column.id}
                value={column.id}
                badgeLabel={column.label}
                disabled={column.required}
              >
                {column.label}
                {column.required && " (Required)"}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </div>
  );
}
