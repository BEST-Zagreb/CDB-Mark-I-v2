"use client";

import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";
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
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useResponsiblePersons } from "@/hooks/collaborations/use-collaborations";
import { projectMemberService } from "@/services/project-member.service";

interface ResponsiblePersonSelectProps {
  value?: string;
  onValueChange: (value: string) => void;

  placeholder?: string;
  disabled?: boolean;

  /** When set, the dropdown shows only members of that project */
  projectId?: number;
}

type PersonOption = {
  id?: string;
  fullName: string;
  email?: string | null;
};

export function ResponsiblePersonSelect({
  value,
  onValueChange,
  placeholder = "Search or enter responsible person...",
  disabled = false,
  projectId,
}: ResponsiblePersonSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  const restrictToProjectMembers = !!projectId && projectId > 0;

  // Global responsible persons (legacy) - used when we don't have projectId
  const { data: responsiblePersons = [], isLoading: isLoadingResponsible } =
    useResponsiblePersons();

  // Project members - used when projectId is available
  const {
    data: projectMemberPersons = [],
    isLoading: isLoadingProjectMembers,
  } = useQuery({
    queryKey: ["projectMembersForResponsibleSelect", projectId],
    queryFn: async () => {
      const data = await projectMemberService.getByProject(projectId!);
      // Map into the shape expected by the select
      const mapped: PersonOption[] = data.items.map((m) => ({
        id: m.appUserId,
        fullName: m.fullName,
        email: m.email,
      }));
      // Optional: de-dupe by fullName+email
      const seen = new Set<string>();
      return mapped.filter((p) => {
        const key = `${p.fullName}|${p.email ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    enabled: restrictToProjectMembers,
    staleTime: 5 * 60 * 1000,
  });

  const options: PersonOption[] = restrictToProjectMembers
    ? projectMemberPersons
    : (responsiblePersons as unknown as PersonOption[]);

  const isLoadingOptions = restrictToProjectMembers
    ? isLoadingProjectMembers
    : isLoadingResponsible;

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

  const filteredOptions = useMemo(() => {
    if (!inputValue || inputValue.length < 2) {
      return options.slice(0, 50);
    }

    const q = inputValue.toLowerCase();
    return options.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false)
    );
  }, [options, inputValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full truncate"
          disabled={disabled || isLoadingOptions}
        >
          {inputValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[70dvw] sm:max-w-96 p-0">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder={
                restrictToProjectMembers
                  ? "Search team members or type new name..."
                  : "Search or type new name..."
              }
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
            {(!restrictToProjectMembers || (projectId && projectId > 0)) ? (
              filteredOptions.length === 0 && inputValue && inputValue.length >= 2 ? (
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
                    {filteredOptions.map((p) => (
                      <CommandItem
                        key={p.id || p.email || p.fullName}
                        value={p.fullName}
                        onSelect={() => handleSelect(p.fullName)}
                        className="cursor-pointer mb-1"
                      >
                        <div className="flex-1 truncate">
                          {p.fullName}
                          {p.email && (
                            <span className="text-muted-foreground ml-2">
                              ({p.email})
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )
            ) : (
              <CommandEmpty>Select a project first.</CommandEmpty>
            )}
          </CommandList>

          {(!inputValue || inputValue.length < 2) && filteredOptions.length >= 50 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground">
              Showing first 50 persons. Start typing to search all persons.
            </div>
          )}
          {inputValue && inputValue.length >= 2 && filteredOptions.length > 0 && (
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
