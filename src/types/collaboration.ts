import { z } from "zod";

// Database collaboration interface
export interface CollaborationDB {
  id: number;
  company_id: number;
  project_id: number;
  person_id: number | null;
  responsible: string | null;
  comment: string | null;
  // Progress indicators (boolean)
  contacted: boolean;
  letter: boolean;
  meeting: boolean | null;
  // Status field (tri-state: null = Pending, true = Successful, false = Rejected)
  successful: boolean | null;
  priority: string; // Changed from number to string
  created_at: string | null;
  updated_at: string | null;
  amount: number | null;
  contact_in_future: boolean | null;
  type: string | null;
}

// UI collaboration interface (transformed from DB)
export interface Collaboration {
  id: number;
  companyId: number;
  projectId: number;
  contactId: number | null;
  responsible: string | null;
  comment: string | null;
  // Progress indicators (boolean)
  contacted: boolean;
  letter: boolean;
  meeting: boolean | null;
  // Status field (tri-state: null = Pending, true = Successful, false = Rejected)
  successful: boolean | null;
  priority: "Low" | "Medium" | "High";
  createdAt: Date | string | null; // Can be string due to JSON serialization
  updatedAt: Date | string | null; // Can be string due to JSON serialization
  amount: number | null;
  contactInFuture: boolean | null;
  type: string | null;
  // Related data that might be joined
  companyName?: string;
  contactName?: string;
  projectName?: string;
  responsibleUserId?: string | null;
  // Warning flag: true if company has ANY "do not contact" collaboration
  companyHasDoNotContact?: boolean;
}

// Validation schema for collaboration forms
export const collaborationSchema = z.object({
  companyId: z.number().positive("Company is required"),
  projectId: z.number().positive("Project is required"),
  contactId: z.number().positive().optional(),
  responsible: z.string().min(1, "Responsible contact is required"),
  comment: z.string().optional(),
  // Progress indicators
  contacted: z.boolean(),
  letter: z.boolean(),
  meeting: z.boolean().optional(),
  // Status field (tri-state: null = Pending, true = Successful, false = Rejected)
  successful: z.boolean().nullable().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  amount: z.number().positive().optional(),
  contactInFuture: z.boolean().optional(),
  type: z.enum(["Financial", "Material", "Educational"]).nullable(),
});

// Form data for creating/updating collaborations
export type CollaborationFormData = z.infer<typeof collaborationSchema>;

export type CollaborationSchema = z.infer<typeof collaborationSchema>;
