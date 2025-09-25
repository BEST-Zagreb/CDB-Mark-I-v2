"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProjectsPageHeaderProps {
  projectsCount: number;
  isMobile: boolean;
  onCreateProject: () => void;
}

export function ProjectsPageHeader({
  projectsCount,
  isMobile,
  onCreateProject,
}: ProjectsPageHeaderProps) {
  return (
    <div className="flex justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
          Projects
        </h1>
        <Badge variant="secondary">{projectsCount}</Badge>
      </div>
      <Button onClick={onCreateProject} size={isMobile ? "sm" : "default"}>
        <Plus className="size-4" />
        New Project
      </Button>
    </div>
  );
}
