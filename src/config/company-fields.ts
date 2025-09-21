import {
  Building2,
  Globe,
  MapPin,
  MapPinIcon,
  Hash,
  Phone,
  Calendar,
  MessageCircle,
} from "lucide-react";
import { Company } from "@/types/company";

// Define available columns for the company table
export const COMPANY_FIELDS: Array<{
  id: keyof Company;
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
    icon: Building2,
  },
  {
    id: "url",
    label: "Website",
    required: false,
    sortable: true,
    center: false,
    icon: Globe,
  },
  {
    id: "address",
    label: "Address",
    required: false,
    sortable: true,
    center: false,
    icon: MapPin,
  },
  {
    id: "city",
    label: "City",
    required: false,
    sortable: true,
    center: false,
    icon: MapPinIcon,
  },
  {
    id: "zip",
    label: "ZIP Code",
    required: false,
    sortable: true,
    center: true,
    icon: Hash,
  },
  {
    id: "country",
    label: "Country",
    required: false,
    sortable: true,
    center: false,
    icon: Globe,
  },
  {
    id: "phone",
    label: "Phone",
    required: false,
    sortable: false,
    center: false,
    icon: Phone,
  },
  {
    id: "budgeting_month",
    label: "Budgeting Month",
    required: false,
    sortable: true,
    center: false,
    icon: Calendar,
  },
  {
    id: "comment",
    label: "Comment",
    required: false,
    sortable: true,
    center: false,
    icon: MessageCircle,
  },
];
