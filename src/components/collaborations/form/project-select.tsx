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
import { useProjects } from "@/app/projects/hooks/use-projects";
import { useEffect } from "react";

interface ProjectSelectProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProjectSelect({
  value,
  onValueChange,
  placeholder = "Select project...",
  disabled = false,
  className,
}: ProjectSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const { data: allProjects, isLoading, error } = useProjects();

  // Find the project with the most recent updated_at date
  const mostRecentProject = React.useMemo(() => {
    if (!allProjects || allProjects.length === 0) return null;

    return allProjects.reduce((mostRecent, current) => {
      if (!current.updated_at) return mostRecent;
      if (!mostRecent.updated_at) return current;

      return current.updated_at > mostRecent.updated_at ? current : mostRecent;
    });
  }, [allProjects]);

  // Auto-select the most recent project when no value is provided and projects are loaded
  useEffect(() => {
    if (
      !value &&
      mostRecentProject &&
      !isLoading &&
      allProjects &&
      allProjects.length > 0
    ) {
      onValueChange(mostRecentProject.id);
    }
  }, [value, mostRecentProject, isLoading, allProjects, onValueChange]);

  // Filter projects based on search
  const filteredProjects = React.useMemo(() => {
    if (!allProjects) return [];
    if (!searchValue) return allProjects;

    const search = searchValue.toLowerCase();
    return allProjects.filter((project) =>
      project.name.toLowerCase().includes(search)
    );
  }, [allProjects, searchValue]);

  const selectedProject = allProjects?.find((project) => project.id === value);

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Failed to load projects. Please try again.
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
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading projects...
            </>
          ) : selectedProject ? (
            <span className="truncate">{selectedProject.name}</span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[70dvw] sm:max-w-56 p-0">
        <Command>
          <CommandInput
            placeholder="Search projects..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              No project with name &quot;{searchValue}&quot; found
            </CommandEmpty>
            <CommandGroup>
              {filteredProjects?.map((project) => (
                <CommandItem
                  key={project.id}
                  className={cn(
                    "cursor-pointer",
                    value === project.id && "bg-muted font-bold"
                  )}
                  value={project.id.toString()}
                  onSelect={() => {
                    onValueChange(
                      project.id === value ? undefined : project.id
                    );
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <div className="flex flex-col w-full">
                    <span className="font-medium truncate">{project.name}</span>
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
