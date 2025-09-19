import { z } from "zod";

// Database project type (what we get from the database)
export interface ProjectDB {
  id: number;
  name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Project type for our application
export interface Project {
  id: number;
  name: string;
  created_at: Date | null;
  updated_at: Date | null;
}

// Zod schema for project validation
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(50, "Project name must be 50 characters or less"),
});

// Schema for creating a new project
export const createProjectSchema = projectSchema;

// Schema for updating a project
export const updateProjectSchema = projectSchema.partial();

// Schema for project form data
export type ProjectFormData = z.infer<typeof projectSchema>;

// Schema for create project request
export type CreateProjectData = z.infer<typeof createProjectSchema>;

// Schema for update project request
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;

// Helper function to convert database project to application project
export function dbProjectToProject(dbProject: ProjectDB): Project {
  const parseDate = (dateStr: string | null): Date | null => {
    if (!dateStr || dateStr === "null") return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  return {
    id: dbProject.id,
    name: dbProject.name || "",
    created_at: parseDate(dbProject.created_at),
    updated_at: parseDate(dbProject.updated_at),
  };
}
