import axios from "axios";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

const API_BASE = "/api/collaborations";

export const collaborationService = {
  // Get all collaborations with optional project filter
  async getAll(projectId?: number): Promise<Collaboration[]> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },

  // Get collaboration by ID
  async getById(id: number): Promise<Collaboration> {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  // Create new collaboration
  async create(data: CollaborationFormData): Promise<Collaboration> {
    const response = await axios.post(API_BASE, data);
    return response.data;
  },

  // Update existing collaboration
  async update(
    id: number,
    data: CollaborationFormData
  ): Promise<Collaboration> {
    const response = await axios.put(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // Delete collaboration
  async delete(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/${id}`);
  },

  // Get collaborations for a specific project
  async getByProject(projectId: number): Promise<Collaboration[]> {
    return this.getAll(projectId);
  },

  // Get collaborations for a specific company
  async getByCompany(companyId: number): Promise<Collaboration[]> {
    const params = { company_id: companyId };
    const response = await axios.get(API_BASE, { params });
    return response.data;
  },
};
