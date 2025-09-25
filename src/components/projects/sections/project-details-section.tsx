"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types/project";

interface ProjectDetailsSectionProps {
  project: Project;
}

export function ProjectDetailsSection({ project }: ProjectDetailsSectionProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";

    let dateObj: Date;
    if (typeof date === "string") {
      if (date === "null" || date === "") return "—";
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return "—";

    return new Intl.DateTimeFormat("hr-HR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Project Name
            </label>
            <p className="mt-1 font-medium">{project.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Fundraising Goal
            </label>
            <p className="mt-1 font-medium">
              {project.frGoal &&
              new Date(project.updated_at || new Date()) <
                new Date("2023-01-01")
                ? new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "HRK",
                  }).format(project.frGoal)
                : new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(project.frGoal || 0) || "Not specified"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Project ID
            </label>
            <p className="mt-1 text-sm text-muted-foreground">#{project.id}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Created
            </label>
            <p className="mt-1">{formatDate(project.created_at)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Last Updated
            </label>
            <p className="mt-1">{formatDate(project.updated_at)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
