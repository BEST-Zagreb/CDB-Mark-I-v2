"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { useResponsiblePersons } from "@/hooks/collaborations/use-collaborations";
import { is } from "drizzle-orm";

interface ResponsiblePersonSelectProps {
  value?: string;
  onValueChange: (value: string) => void;

  placeholder?: string;
  disabled?: boolean;
}

export function ResponsiblePersonSelect({
  value,
  onValueChange,

  placeholder = "Search or enter responsible person...",
}: ResponsiblePersonSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // Fetch all existing responsible persons for autocomplete
  const { data: responsiblePersons = [], isLoading: isLoadingResponsible } =
    useResponsiblePersons();

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    const trimmedValue = selectedValue.trim();
    setInputValue(trimmedValue);
    onValueChange(trimmedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    const trimmedValue = newValue.trim();
    setInputValue(trimmedValue);
    onValueChange(trimmedValue);
  };

  const filteredOptions = responsiblePersons.filter(
    (responsiblePerson) =>
      responsiblePerson.fullName
        .toLowerCase()
        .includes(inputValue.toLowerCase()) ||
      responsiblePerson.email?.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full truncate"
          disabled={isLoadingResponsible}
        >
          {inputValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[70dvw] sm:max-w-115 p-0">
        <Command>
          <CommandInput
            placeholder="Search or type new name..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {filteredOptions.length === 0 && inputValue ? (
              <CommandEmpty className="p-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    No existing matches found.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleSelect(inputValue)}
                  >
                    Use &quot;{inputValue}&quot;
                  </Button>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {filteredOptions.length === 0 && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}

                <CommandGroup>
                  {filteredOptions.map((responsiblePerson) => (
                    <CommandItem
                      key={
                        responsiblePerson.id ||
                        responsiblePerson.email ||
                        responsiblePerson.fullName
                      }
                      value={responsiblePerson.fullName}
                      onSelect={() => handleSelect(responsiblePerson.fullName)}
                      className="cursor-pointer mb-1"
                    >
                      {responsiblePerson.fullName}{" "}
                      {responsiblePerson.email && (
                        <span className="text-muted-foreground ml-auto text-xs">
                          {responsiblePerson.email}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
