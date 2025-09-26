import { Briefcase, Target, Calendar, CalendarDays, Hash } from "lucide-react";
import { Project } from "@/types/project";

// Define available columns for the project table
export const PROJECT_FIELDS: Array<{
  id: keyof Project;
  label: string;
  required: boolean;
  sortable: boolean;
  center: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "id",
    label: "ID",
    required: false,
    sortable: true,
    center: true,
    icon: Hash,
  },
  {
    id: "name",
    label: "Name",
    required: true,
    sortable: true,
    center: false,
    icon: Briefcase,
  },

  {
    id: "frGoal",
    label: "FR Goal",
    required: false,
    sortable: true,
    center: false,
    icon: Target,
  },

  {
    id: "created_at",
    label: "Created",
    required: false,
    sortable: true,
    center: true,
    icon: Calendar,
  },
  {
    id: "updated_at",
    label: "Last update",
    required: false,
    sortable: true,
    center: true,
    icon: CalendarDays,
  },
];
