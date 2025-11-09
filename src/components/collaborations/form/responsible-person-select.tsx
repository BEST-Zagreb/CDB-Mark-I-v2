"use client";

import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";
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

  const filteredOptions = React.useMemo(() => {
    // If no search value or less than 2 characters, show first 50
    if (!inputValue || inputValue.length < 2) {
      return responsiblePersons.slice(0, 50);
    }

    // If user typed 2+ characters, show ALL matching results
    return responsiblePersons.filter(
      (responsiblePerson) =>
        responsiblePerson.fullName
          .toLowerCase()
          .includes(inputValue.toLowerCase()) ||
        responsiblePerson.email
          ?.toLowerCase()
          .includes(inputValue.toLowerCase())
    );
  }, [responsiblePersons, inputValue]);

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

      <PopoverContent className="w-[70dvw] sm:max-w-96 p-0">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder="Search or type new name..."
              value={inputValue}
              onValueChange={handleInputChange}
            />
            {inputValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInputValue("");
                  onValueChange("");
                }}
                className="absolute right-4 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList>
            {filteredOptions.length === 0 &&
            inputValue &&
            inputValue.length >= 2 ? (
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
                  <CommandEmpty>Start typing to search...</CommandEmpty>
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
                      <div className="flex-1 truncate">
                        {responsiblePerson.fullName}
                        {responsiblePerson.email && (
                          <span className="text-muted-foreground ml-2">
                            ({responsiblePerson.email})
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          {(!inputValue || inputValue.length < 2) &&
            filteredOptions.length >= 50 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Showing first 50 persons. Start typing to search all persons.
              </div>
            )}
          {inputValue &&
            inputValue.length >= 2 &&
            filteredOptions.length > 0 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Found {filteredOptions.length} matching{" "}
                {filteredOptions.length === 1 ? "person" : "persons"}.
              </div>
            )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
