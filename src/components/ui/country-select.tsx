"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { useCountries } from "@/hooks/use-countries";
import { CountryOption } from "@/types/country";

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country...",
  disabled = false,
  className,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const { data: countries, isLoading, error } = useCountries();

  // Default to Croatia if no value is provided
  React.useEffect(() => {
    if (!value && countries && countries.length > 0) {
      const croatia = countries.find((country) => country.value === "Croatia");
      if (croatia) {
        onValueChange(croatia.value);
      }
    }
  }, [countries, value, onValueChange]);

  const selectedCountry = countries?.find((country) => country.value === value);

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!countries) return [];
    if (!searchValue) return countries;

    const search = searchValue.toLowerCase();
    return countries.filter((country) =>
      country.searchTerms.some((term) => term.toLowerCase().includes(search))
    );
  }, [countries, searchValue]);

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to load countries. Please try again.
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="">
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading countries...
            </>
          ) : selectedCountry ? (
            selectedCountry.label
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-min p-0" align="start">
        <Command>
          <CommandInput
            className="w-fit"
            placeholder="Search countries..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {filteredCountries.map((country) => (
                <CommandItem
                  key={country.value}
                  className={cn(
                    "cursor-pointer",
                    value === country.value && "bg-muted font-bold"
                  )}
                  value={country.value}
                  onSelect={(currentValue: string) => {
                    onValueChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  {country.label}

                  <span className="ml-auto font-mono text-xs bg-muted px-1 rounded">
                    {country.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
