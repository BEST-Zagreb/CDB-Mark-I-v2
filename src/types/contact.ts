import { z } from "zod";

// Database contact interface
export interface ContactDB {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_id: number;
  function: string | null;
  created_at: string | null;
}

// UI contact interface (transformed from DB)
export interface Contact {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  companyId: number;
  function: string | null;
  createdAt: Date | string | null;
  // Related data that might be joined
  companyName?: string;
}

// Validation schema for contact forms
export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Valid email is required")
    .or(z.literal(""))
    .optional(),
  phone: z.string().optional(),
  companyId: z.number().positive("Company is required"),
  function: z.string().optional(),
});

// Form data for creating/updating contacts
export type ContactFormData = z.infer<typeof contactSchema>;

export type ContactSchema = z.infer<typeof contactSchema>;
