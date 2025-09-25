"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Project } from "@/types/project";
import { Collaboration } from "@/types/collaboration";

interface ProjectFundraisingSectionProps {
  project: Project;
  collaborations: Collaboration[];
}

export function ProjectFundraisingSection({
  project,
  collaborations,
}: ProjectFundraisingSectionProps) {
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

  if (!project.frGoal) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fundraising Progress</CardTitle>
        <CardDescription>
          Progress towards the fundraising goal based on collaborations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount Raised</span>
            <span className="font-medium">
              {new Date(project.updated_at || new Date()) <
              new Date("2023-01-01")
                ? new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "HRK",
                  }).format(totalRaised)
                : new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(totalRaised)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Goal</span>
            <span className="font-medium">
              {new Date(project.updated_at || new Date()) <
              new Date("2023-01-01")
                ? new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "HRK",
                  }).format(project.frGoal)
                : new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(project.frGoal)}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {progressPercentage.toFixed(1)}% Complete
            </span>
            <span className="text-muted-foreground">
              {new Date(project.updated_at || new Date()) <
              new Date("2023-01-01")
                ? new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "HRK",
                  }).format(Math.max(0, project.frGoal - totalRaised))
                : new Intl.NumberFormat("hr-HR", {
                    style: "currency",
                    currency: "EUR",
                  }).format(Math.max(0, project.frGoal - totalRaised))}{" "}
              remaining
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
