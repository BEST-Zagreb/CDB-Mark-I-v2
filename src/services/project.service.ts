import axios from "axios";
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
} from "@/types/project";

const api = axios.create({
  baseURL: "/api",
});

export const projectService = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await api.get("/projects");
    return response.data;
  },

  // Get a specific project by ID
  getById: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Create a new project
  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post("/projects", data);
    return response.data;
  },

  // Update a project
  update: async (id: number, data: UpdateProjectData): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  // Delete a project
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
