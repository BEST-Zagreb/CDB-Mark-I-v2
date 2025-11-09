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
import { Badge } from "@/components/ui/badge";
import { useCompanies } from "@/app/companies/hooks/use-companies";

interface MultiCompanySelectProps {
  values: number[];
  onValuesChange: (values: number[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiCompanySelect({
  values,
  onValuesChange,
  placeholder = "Select companies...",
  disabled = false,
  className,
}: MultiCompanySelectProps) {
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

    // If user typed 2+ characters, show ALL matching results (no limit)
    const search = searchValue.toLowerCase();
    return allCompanies.filter(
      (company) =>
        company.name.toLowerCase().includes(search) ||
        company.city?.toLowerCase().includes(search) ||
        company.country?.toLowerCase().includes(search)
    );
  }, [allCompanies, searchValue]);
  const selectedCompanies = React.useMemo(() => {
    if (!allCompanies) return [];
    return allCompanies.filter((company) => values.includes(company.id));
  }, [allCompanies, values]);

  const toggleCompany = (companyId: number) => {
    if (values.includes(companyId)) {
      onValuesChange(values.filter((id) => id !== companyId));
    } else {
      onValuesChange([...values, companyId]);
    }
  };

  const removeCompany = (companyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onValuesChange(values.filter((id) => id !== companyId));
  };

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
          className={cn("justify-between w-full min-h-10 h-auto", className)}
          disabled={disabled || isLoadingCompanies}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {isLoadingCompanies ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading companies...
              </>
            ) : selectedCompanies.length > 0 ? (
              selectedCompanies.map((company) => (
                <Badge
                  key={company.id}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {company.name}
                  <button
                    type="button"
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => removeCompany(company.id, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[70dvw] sm:max-w-96 p-0">
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
                onClick={() => setSearchValue("")}
                className="absolute right-4 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList>
            <CommandEmpty>
              {searchValue ? "No companies found." : "Start typing to search..."}
            </CommandEmpty>
            <CommandGroup>
              {filteredCompanies.map((company) => {
                const isSelected = values.includes(company.id);
                return (
                  <CommandItem
                    key={company.id}
                    value={company.id.toString()}
                    onSelect={() => toggleCompany(company.id)}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 truncate">
                      {company.name}
                      {company.city && (
                        <span className="text-muted-foreground ml-2">
                          ({company.city})
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
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
