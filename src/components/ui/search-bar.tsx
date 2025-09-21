"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearchChange?: (query: string) => void;
}

export function SearchBar({
  placeholder = "Search...",
  className = "",
  onSearchChange,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize search query from URL params
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("search") || ""
  );

  // Debounce the search query for URL updates
  const debouncedSearchQuery = useDebounce(searchQuery, 100);

  // Update URL when debounced search query changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (debouncedSearchQuery) {
      params.set("search", debouncedSearchQuery);
    } else {
      params.delete("search");
    }

    // Update URL without triggering a page reload
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [debouncedSearchQuery, router, searchParams]);

  // Notify parent component of search changes
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, onSearchChange]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  return (
    <div className={`relative w-full sm:w-xs ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        className="pl-10 pr-10"
      />

      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
