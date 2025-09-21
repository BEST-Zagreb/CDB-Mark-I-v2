import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Building2,
  Hash,
} from "lucide-react";
import { Person } from "@/types/person";

// Define available columns for the person table
export const PERSON_FIELDS: Array<{
  id: keyof Person;
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
    id: "companyId",
    label: "Company ID",
    required: false,
    sortable: true,
    center: true,
    icon: Hash,
  },
  {
    id: "companyName",
    label: "Company",
    required: false,
    sortable: true,
    center: false,
    icon: Building2,
  },
  {
    id: "name",
    label: "Name",
    required: true,
    sortable: true,
    center: false,
    icon: User,
  },
  {
    id: "email",
    label: "Email",
    required: false,
    sortable: true,
    center: false,
    icon: Mail,
  },
  {
    id: "phone",
    label: "Phone",
    required: false,
    sortable: true,
    center: false,
    icon: Phone,
  },
  {
    id: "function",
    label: "Function",
    required: false,
    sortable: true,
    center: false,
    icon: Briefcase,
  },
  {
    id: "createdAt",
    label: "Created",
    required: false,
    sortable: true,
    center: false,
    icon: Calendar,
  },
];
