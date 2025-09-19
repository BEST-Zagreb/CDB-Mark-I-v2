"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { companyService } from "@/services/company.service";
import { Company } from "@/types/company";
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
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      toast.success("Company created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create company");
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<Company, "id"> }) =>
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to update company");
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      toast.success("Company deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete company");
    },
  });
}
