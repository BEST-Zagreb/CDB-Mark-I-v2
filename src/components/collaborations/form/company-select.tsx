"use client";

import * as React from "react";
import { ChevronsUpDown, Loader2, X } from "lucide-react";
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
import { useCompanies } from "@/app/companies/hooks/use-companies";

interface CompanySelectProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CompanySelect({
  value,
  onValueChange,
  placeholder = "Select company...",
  disabled = false,
  className,
}: CompanySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const {
    data: allCompanies,
    isLoading: isLoadingCompanies,
    error,
  } = useCompanies();

  // Filter companies based on search
  const filteredCompanies = React.useMemo(() => {
    if (!allCompanies) return [];

    // If no search value or less than 2 characters, show first 50 companies
    if (!searchValue || searchValue.length < 2)
      return allCompanies.slice(0, 50);

    // If user typed 2+ characters, show ALL matching results
    const search = searchValue.toLowerCase();
    return allCompanies.filter(
      (company) =>
        company.name.toLowerCase().includes(search) ||
        company.city?.toLowerCase().includes(search) ||
        company.country?.toLowerCase().includes(search)
    );
  }, [allCompanies, searchValue]);

  const selectedCompany = allCompanies?.find((company) => company.id === value);

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to load companies. Please try again.
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between w-full truncate", className)}
          disabled={disabled || isLoadingCompanies}
        >
          <span className="truncate">
            {isLoadingCompanies ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                Loading companies...
              </>
            ) : selectedCompany ? (
              selectedCompany.name
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[70dvw] sm:max-w-56 p-0">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder="Search companies..."
              value={searchValue}
              onValueChange={(value) => {
                setSearchValue(value);
              }}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchValue("");
                }}
                className="absolute right-4 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList>
            <CommandEmpty>
              {searchValue ? "No company found." : "Start typing to search..."}
            </CommandEmpty>
            <CommandGroup>
              {filteredCompanies?.map((company) => (
                <CommandItem
                  key={company.id}
                  className={cn(
                    "cursor-pointer",
                    value === company.id && "bg-muted font-bold"
                  )}
                  value={company.id.toString()}
                  onSelect={() => {
                    onValueChange(
                      company.id === value ? undefined : company.id
                    );
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <div className="flex-1 truncate">
                    {company.name}
                    {company.city && (
                      <span className="text-muted-foreground ml-2">
                        ({company.city})
                      </span>
                    )}
                  </div>
                </CommandItem>
              )) || []}
            </CommandGroup>
          </CommandList>
          {(!searchValue || searchValue.length < 2) &&
            filteredCompanies.length >= 50 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Showing first 50 companies. Start typing to search all
                companies.
              </div>
            )}
          {searchValue &&
            searchValue.length >= 2 &&
            filteredCompanies.length > 0 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Found {filteredCompanies.length} matching{" "}
                {filteredCompanies.length === 1 ? "company" : "companies"}.
              </div>
            )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
