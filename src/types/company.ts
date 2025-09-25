import { z } from "zod";
import { CROATIAN_MONTHS } from "@/app/companies/constants/months";

// Valid Croatian month values
const VALID_MONTHS = CROATIAN_MONTHS;

// Database company type (what we get from the database)
export interface CompanyDB {
  id: number;
  name: string | null;
  url: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
  budgeting_month: string | null;
  comment: string | null;
}

// Company type for our application
export interface Company {
  id: number;
  name: string;
  url: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  budgeting_month: string;
  comment: string;
}

// Zod schema for company validation
export const companySchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name must be 100 characters or less"),
  url: z.string().max(200, "URL must be 200 characters or less"),
  address: z.string().max(200, "Address must be 200 characters or less"),
  city: z.string().max(100, "City must be 100 characters or less"),
  zip: z.string().max(20, "ZIP code must be 20 characters or less"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country must be 100 characters or less"),
  phone: z.string().max(50, "Phone must be 50 characters or less"),
  budgeting_month: z
    .string()
    .refine((val) => val === "" || VALID_MONTHS.includes(val as any), {
      message: "Please select a valid month",
    }),
  comment: z.string().max(500, "Comment must be 500 characters or less"),
});

// Schema for creating a new company
export const createCompanySchema = companySchema;

// Schema for updating a company
export const updateCompanySchema = companySchema.partial();

// Schema for company form data
export type CompanyFormData = z.infer<typeof companySchema>;

// Schema for create company request
export type CreateCompanyData = z.infer<typeof createCompanySchema>;

// Schema for update company request
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>;

// Helper function to convert database company to application company
export function dbCompanyToCompany(dbCompany: CompanyDB): Company {
  return {
    id: dbCompany.id,
    name: dbCompany.name || "",
    url: dbCompany.url || "",
    address: dbCompany.address || "",
    city: dbCompany.city || "",
    zip: dbCompany.zip || "",
    country: dbCompany.country || "",
    phone: dbCompany.phone || "",
    budgeting_month: dbCompany.budgeting_month || "",
    comment: dbCompany.comment || "",
  };
}
