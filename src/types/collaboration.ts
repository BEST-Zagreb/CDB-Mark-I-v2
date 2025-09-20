import { z } from "zod";

// Database collaboration interface
export interface CollaborationDB {
  id: number;
  company_id: number;
  project_id: number;
  person_id: number | null;
  responsible: string | null;
  comment: string | null;
  contacted: boolean;
  successful: boolean | null;
  letter: boolean;
  meeting: boolean | null;
  priority: string; // Changed from number to string
  created_at: string | null;
  updated_at: string | null;
  amount: number | null;
  contact_in_future: boolean | null;
  type: string;
}

// UI collaboration interface (transformed from DB)
export interface Collaboration {
  id: number;
  companyId: number;
  projectId: number;
  personId: number | null;
  responsible: string | null;
  comment: string | null;
  contacted: boolean;
  successful: boolean | null;
  letter: boolean;
  meeting: boolean | null;
  priority: string; // Changed from number to string
  createdAt: Date | string | null; // Can be string due to JSON serialization
  updatedAt: Date | string | null; // Can be string due to JSON serialization
  amount: number | null;
  contactInFuture: boolean | null;
  type: string;
  // Related data that might be joined
  companyName?: string;
  personName?: string;
  projectName?: string;
}

// Validation schema for collaboration forms
export const collaborationSchema = z.object({
  companyId: z.number().positive("Company is required"),
  projectId: z.number().positive("Project is required"),
  personId: z.number().positive().optional(),
  responsible: z.string().min(1, "Responsible person is required"),
  comment: z.string().optional(),
  contacted: z.boolean(),
  successful: z.boolean().optional(),
  letter: z.boolean(),
  meeting: z.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]),
  amount: z.number().positive().optional(),
  contactInFuture: z.boolean().optional(),
  type: z.enum(["financijska", "materijalna", "edukacija"]),
});

// Form data for creating/updating collaborations
export type CollaborationFormData = z.infer<typeof collaborationSchema>;

export type CollaborationSchema = z.infer<typeof collaborationSchema>;

// Status helper functions
export function getCollaborationStatusText(
  collaboration: Collaboration
): string {
  if (collaboration.successful === true) return "Successful";
  if (collaboration.successful === false) return "Failed";
  if (collaboration.contacted) return "Contacted";
  return "Not contacted";
}

export function getCollaborationStatusColor(
  collaboration: Collaboration
): string {
  if (collaboration.successful === true) return "text-green-600";
  if (collaboration.successful === false) return "text-red-600";
  if (collaboration.contacted) return "text-yellow-600";
  return "text-gray-600";
}

export function getCollaborationTypeDisplay(type: string): string {
  switch (type) {
    case "financijska":
      return "Financial";
    case "materijalna":
      return "Material";
    case "edukacija":
      return "Educational";
    default:
      return type;
  }
}

export function getPriorityDisplay(priority: string): string {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return "Unknown";
  }
}

// Helper function to get priority order value for sorting
export function getPriorityOrder(priority: string): number {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}
