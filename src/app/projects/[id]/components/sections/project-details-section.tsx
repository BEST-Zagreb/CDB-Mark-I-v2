"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types/project";
import { Collaboration } from "@/types/collaboration";
import { formatCurrency } from "@/lib/format-utils";

interface ProjectDetailsSectionProps {
  project: Project;
  collaborations?: Collaboration[];
}

export function ProjectDetailsSection({
  project,
  collaborations = [],
}: ProjectDetailsSectionProps) {
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

  // Calculate fundraising progress
  const calculateFundraisingProgress = () => {
    if (!project?.frGoal || !collaborations.length) {
      return { totalRaised: 0, progressPercentage: 0 };
    }

    // Sum up amounts from successful collaborations only
    const totalRaised = collaborations
      .filter((collaboration) => collaboration.amount)
      .reduce((sum, collaboration) => sum + (collaboration.amount || 0), 0);

    const progressPercentage = (totalRaised / project.frGoal) * 100;

    return { totalRaised, progressPercentage };
  };

  const { totalRaised, progressPercentage } = calculateFundraisingProgress();

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Row 1: Created, Updated */}

        <div className="flex flex-wrap items-center justify-left gap-6">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Created
            </label>
            <p className="mt-1 text-sm">{formatDate(project.created_at)}</p>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Last Updated
            </label>
            <p className="mt-1 text-sm">{formatDate(project.updated_at)}</p>
          </div>
        </div>

        {/* Row 2: Fundraising Progress */}
        {project.frGoal && (
          <div className="space-y-3">
            <label className="text-sm font-bold">Fundraising Progress</label>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Raised</span>
                <span className="font-medium text-right">
                  {formatCurrency(
                    totalRaised,
                    project.created_at || project.updated_at
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Goal</span>
                <span className="font-medium text-right">
                  {formatCurrency(
                    project.frGoal,
                    project.created_at || project.updated_at
                  )}
                </span>
              </div>
              <Progress
                value={Math.min(progressPercentage, 100)}
                className="h-3"
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {progressPercentage.toFixed(1)}% Complete
                </span>
                <span className="text-muted-foreground text-right">
                  {formatCurrency(
                    project.frGoal - totalRaised,
                    project.created_at || project.updated_at
                  )}{" "}
                  remaining
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
