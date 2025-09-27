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
import { useCountries } from "@/hooks/use-countries";

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
  const { data: countries = [], isLoading } = useCountries();

  // Default to Croatia if no value is provided
  React.useEffect(() => {
    if (!value && countries.length > 0) {
      const croatia = countries.find((country) => country.value === "Croatia");
      if (croatia) {
        onValueChange(croatia.value);
      }
    }
  }, [countries, value, onValueChange]);

  const selectedCountry = countries.find((country) => country.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between w-full truncate",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled || isLoading}
        >
          {isLoading
            ? "Loading countries..."
            : selectedCountry
            ? selectedCountry.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[70dvw] sm:max-w-56 p-0">
        <Command>
          <CommandInput placeholder="Search countries..." className="h-9" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  className={cn(
                    "cursor-pointer",
                    value === country.value && "bg-muted font-bold"
                  )}
                  value={country.label}
                  onSelect={() => {
                    onValueChange(country.value);
                    setOpen(false);
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
