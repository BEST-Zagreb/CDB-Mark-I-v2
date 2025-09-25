"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CROATIAN_MONTHS } from "@/app/companies/constants/months";

interface MonthSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MonthSelect({
  value,
  onValueChange,
  placeholder = "Select month...",
  disabled = false,
  className,
}: MonthSelectProps) {
  const handleValueChange = (selectedValue: string) => {
    // Convert "unknown" back to empty string for the form
    if (selectedValue === "unknown") {
      onValueChange("");
    } else {
      onValueChange(selectedValue);
    }
  };

  // Convert empty string to "unknown" for the select component
  const selectValue = value === "" || !value ? "unknown" : value;

  return (
    <Select
      value={selectValue}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Months</SelectLabel>
          <SelectItem value="unknown">Unknown</SelectItem>
          {CROATIAN_MONTHS.map((month) => (
            <SelectItem key={month} value={month}>
              {month}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
