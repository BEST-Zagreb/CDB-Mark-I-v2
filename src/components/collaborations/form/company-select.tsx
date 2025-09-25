"use client";

import * as React from "react";
import { ChevronsUpDown, Loader2 } from "lucide-react";
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
    if (!searchValue) return allCompanies;

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
          className={cn("justify-between", className)}
          disabled={disabled || isLoadingCompanies}
        >
          {isLoadingCompanies ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading companies...
            </>
          ) : selectedCompany ? (
            <span className="truncate">{selectedCompany.name}</span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[70dvw] sm:max-w-56 p-0">
        <Command>
          <CommandInput
            placeholder="Search companies..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No company found.</CommandEmpty>
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
                  <div className="flex flex-col">
                    <span className="font-medium">{company.name}</span>
                    {(company.city || company.country) && (
                      <span className="text-xs text-muted-foreground">
                        {[company.city, company.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </CommandItem>
              )) || []}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
