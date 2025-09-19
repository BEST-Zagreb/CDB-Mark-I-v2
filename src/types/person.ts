import { z } from "zod";

// Database person interface
export interface PersonDB {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company_id: number;
  function: string | null;
  created_at: string | null;
}

// UI person interface (transformed from DB)
export interface Person {
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

// Validation schema for person forms
export const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  companyId: z.number().positive("Company is required"),
  function: z.string().optional(),
});

// Form data for creating/updating persons
export type PersonFormData = z.infer<typeof personSchema>;

export type PersonSchema = z.infer<typeof personSchema>;
