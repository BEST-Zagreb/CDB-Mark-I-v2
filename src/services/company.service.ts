import axios from "axios";
import type {
  Company,
  CreateCompanyData,
  UpdateCompanyData,
} from "@/types/company";

const api = axios.create({
  baseURL: "/api",
});

export const companyService = {
  // Get all companies
  getAll: async (): Promise<Company[]> => {
    const response = await api.get("/companies");
    return response.data;
  },

  // Get a specific company by ID
  getById: async (id: number): Promise<Company> => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Create a new company
  create: async (data: CreateCompanyData): Promise<Company> => {
    const response = await api.post("/companies", data);
    return response.data;
  },

  // Update a company
  update: async (id: number, data: UpdateCompanyData): Promise<Company> => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  // Delete a company
  delete: async (id: number): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },
};
