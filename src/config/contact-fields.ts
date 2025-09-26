import { User, Mail, Phone, Briefcase, Calendar, Hash } from "lucide-react";
import { Contact } from "@/types/contact";

// Define available columns for the contact table
export const CONTACT_FIELDS: Array<{
  id: keyof Contact;
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
    center: true,
    icon: Briefcase,
  },

  {
    id: "createdAt",
    label: "Created",
    required: false,
    sortable: true,
    center: true,
    icon: Calendar,
  },
];
