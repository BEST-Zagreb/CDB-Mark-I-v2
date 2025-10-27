import { z } from "zod";

// User roles enum
export const UserRole = {
  ADMINISTRATOR: "Administrator",
  PROJECT_RESPONSIBLE: "Project responsible",
  PROJECT_TEAM_MEMBER: "Project team member",
  OBSERVER: "Observer",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

// User type for our application
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRoleType;
  description: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  addedBy: string | null;
  addedByUser: {
    id: string;
    fullName: string | null;
    email: string | null;
  } | null;
  lastLogin: Date | string | null;
  isLocked: boolean;
}

// Zod schema for user validation (for form input)
export const userSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or less"),
  email: z.email("Invalid email address").min(1, "Email is required"),
  role: z.enum([
    UserRole.ADMINISTRATOR,
    UserRole.PROJECT_RESPONSIBLE,
    UserRole.PROJECT_TEAM_MEMBER,
    UserRole.OBSERVER,
  ]),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .nullable(),
  isLocked: z.boolean(),
});

// Schema for creating a new user
export const createUserSchema = userSchema;

// Schema for updating a user
export const updateUserSchema = userSchema.partial();

// Type for user form data - explicitly define with required fields
export type UserFormData = {
  fullName: string;
  email: string;
  role: UserRoleType;
  description?: string | null;
  isLocked: boolean;
};

// Schema for create user request
export type CreateUserData = z.infer<typeof createUserSchema>;

// Schema for update user request
export type UpdateUserData = z.infer<typeof updateUserSchema>;
