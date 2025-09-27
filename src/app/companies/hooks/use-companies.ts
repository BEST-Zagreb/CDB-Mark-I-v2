"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { UpdateCompanyData, CreateCompanyData } from "@/types/company";
import { toast } from "sonner";

// Query keys
export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (filters?: { search?: string }) =>
    [...companyKeys.lists(), { filters }] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
};

// Custom hooks
export function useCompanies(search?: string) {
  return useQuery({
    queryKey: companyKeys.list({ search }),
    queryFn: () => companyService.search(search || ""),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => companyService.getById(id),
    enabled: !!id && !isNaN(id) && id > 0,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyData) => {
      return companyService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      toast.success("Company created successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create company";
      toast.error(message);
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompanyData }) =>
      companyService.update(id, data),
    onSuccess: (updatedCompany) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      if (updatedCompany?.id) {
        queryClient.setQueryData(
          companyKeys.detail(updatedCompany.id),
          updatedCompany
        );
      }
      toast.success("Company updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update company";
      toast.error(message);
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return companyService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      toast.success("Company deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete company";
      toast.error(message);
    },
  });
}
