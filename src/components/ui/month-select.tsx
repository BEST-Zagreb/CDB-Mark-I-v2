"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CROATIAN_MONTHS } from "@/constants/months";

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
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem
                className={cn(
                  "cursor-pointer",
                  value === "" || (!value && "bg-muted  font-bold")
                )}
                value=""
                onSelect={() => {
                  onValueChange("");
                  setOpen(false);
                }}
              >
                Unknown
              </CommandItem>
              {CROATIAN_MONTHS.map((month) => (
                <CommandItem
                  key={month}
                  className={cn(
                    "cursor-pointer",
                    value === month && "bg-muted font-bold"
                  )}
                  value={month}
                  onSelect={(currentValue: string) => {
                    onValueChange(currentValue);
                    setOpen(false);
                  }}
                >
                  {month}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
