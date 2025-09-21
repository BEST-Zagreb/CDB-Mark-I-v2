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
}

export function ColumnSelector({
  fields,
  visibleColumns,
  onColumnsChange,
  placeholder = "Select columns",
}: ColumnSelectorProps) {
  return (
    <MultiSelect values={visibleColumns} onValuesChange={onColumnsChange}>
      <MultiSelectTrigger className="w-full sm:w-auto max-w-xl">
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
  );
}
