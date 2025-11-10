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
import { useProjects } from "@/app/projects/hooks/use-projects";
import { useEffect } from "react";

interface ProjectSelectProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  excludeProjectId?: number;
}

export function ProjectSelect({
  value,
  onValueChange,
  placeholder = "Select project...",
  disabled = false,
  className,
  excludeProjectId,
}: ProjectSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const { data: allProjects, isLoading, error } = useProjects();

  // Find the project with the most recent updated_at date
  const mostRecentProject = React.useMemo(() => {
    if (!allProjects || allProjects.length === 0) return null;

    // Filter out excluded project if specified
    const eligibleProjects = excludeProjectId
      ? allProjects.filter((project) => project.id !== excludeProjectId)
      : allProjects;

    if (eligibleProjects.length === 0) return null;

    return eligibleProjects.reduce((mostRecent, current) => {
      if (!current.updated_at) return mostRecent;
      if (!mostRecent.updated_at) return current;

      return current.updated_at > mostRecent.updated_at ? current : mostRecent;
    });
  }, [allProjects, excludeProjectId]);

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

    // Filter out excluded project if specified
    const projects = excludeProjectId
      ? allProjects.filter((project) => project.id !== excludeProjectId)
      : allProjects;

    // If no search value or less than 2 characters, show first 50 projects
    if (!searchValue || searchValue.length < 2) return projects.slice(0, 50);

    // If user typed 2+ characters, show ALL matching results
    const search = searchValue.toLowerCase();
    return projects.filter((project) =>
      project.name.toLowerCase().includes(search)
    );
  }, [allProjects, searchValue, excludeProjectId]);

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
          <span className="truncate">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                Loading projects...
              </>
            ) : selectedProject ? (
              selectedProject.name
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
              placeholder="Search projects..."
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
              {searchValue ? "No project found." : "Start typing to search..."}
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
                  <div className="flex-1 truncate">{project.name}</div>
                </CommandItem>
              )) || []}
            </CommandGroup>
          </CommandList>
          {(!searchValue || searchValue.length < 2) &&
            filteredProjects.length >= 50 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Showing first 50 projects. Start typing to search all projects.
              </div>
            )}
          {searchValue &&
            searchValue.length >= 2 &&
            filteredProjects.length > 0 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                Found {filteredProjects.length} matching{" "}
                {filteredProjects.length === 1 ? "project" : "projects"}.
              </div>
            )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
