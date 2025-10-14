import {
  User,
  Calendar,
  DollarSign,
  Building2,
  MessageCircle,
  Target,
  Briefcase,
  Hash,
  Tag,
  Users,
  CalendarDays,
  ClockIcon,
  Pickaxe,
} from "lucide-react";
import { Collaboration } from "@/types/collaboration";

// Define available columns for the collaboration table
export const COLLABORATION_FIELDS: Array<{
  id:
    | keyof Collaboration
    | "companyName"
    | "projectName"
    | "contactName"
    | "status";
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
    id: "projectName",
    label: "Project",
    required: true,
    sortable: true,
    center: false,
    icon: Briefcase,
  },
  {
    id: "companyName",
    label: "Company",
    required: true,
    sortable: true,
    center: false,
    icon: Building2,
  },

  {
    id: "type",
    label: "Type",
    required: false,
    sortable: true,
    center: true,
    icon: Tag,
  },
  {
    id: "responsible",
    label: "Responsible",
    required: false,
    sortable: true,
    center: true,
    icon: User,
  },
  {
    id: "priority",
    label: "Priority",
    required: false,
    sortable: true,
    center: true,
    icon: Target,
  },

  {
    id: "contactName",
    label: "Contact",
    required: false,
    sortable: true,
    center: true,
    icon: Users,
  },

  {
    id: "status",
    label: "Status",
    required: false,
    sortable: false, // Status column won't be sortable since it combines multiple fields
    center: false,
    icon: Pickaxe,
  },

  {
    id: "comment",
    label: "Comment",
    required: false,
    sortable: true,
    center: false,
    icon: MessageCircle,
  },

  {
    id: "amount",
    label: "Amount",
    required: false,
    sortable: true,
    center: false,
    icon: DollarSign,
  },

  {
    id: "contactInFuture",
    label: "Future Contact",
    required: false,
    sortable: true,
    center: true,
    icon: ClockIcon,
  },

  {
    id: "createdAt",
    label: "Created",
    required: false,
    sortable: true,
    center: true,
    icon: Calendar,
  },
  {
    id: "updatedAt",
    label: "Last update",
    required: false,
    sortable: true,
    center: true,
    icon: CalendarDays,
  },
];
