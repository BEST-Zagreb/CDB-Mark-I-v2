"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { personService } from "@/services/person.service";
import { Person } from "@/types/person";
import { toast } from "sonner";

// Query keys
export const personKeys = {
  all: ["people"] as const,
  lists: () => [...personKeys.all, "list"] as const,
  list: (filters?: { companyId?: number }) =>
    [...personKeys.lists(), { filters }] as const,
  details: () => [...personKeys.all, "detail"] as const,
  detail: (id: number) => [...personKeys.details(), id] as const,
  byCompany: (companyId: number) =>
    [...personKeys.all, "company", companyId] as const,
};

// Custom hooks
export function usePeople() {
  return useQuery({
    queryKey: personKeys.list(),
    queryFn: personService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePeopleByCompany(companyId: number) {
  return useQuery({
    queryKey: personKeys.byCompany(companyId),
    queryFn: () => personService.getByCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePerson(id: number) {
  return useQuery({
    queryKey: personKeys.detail(id),
    queryFn: () => personService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personService.create,
    onSuccess: (newPerson) => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
      // Invalidate company-specific queries
      if (newPerson?.companyId) {
        queryClient.invalidateQueries({
          queryKey: personKeys.byCompany(newPerson.companyId),
        });
      }
      toast.success("Person created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create person");
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        companyId: number;
        email?: string;
        phone?: string;
        function?: string;
      };
    }) => personService.update(id, data),
    onSuccess: (updatedPerson) => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
      if (updatedPerson?.id) {
        queryClient.setQueryData(
          personKeys.detail(updatedPerson.id),
          updatedPerson
        );
        // Invalidate company-specific queries
        if (updatedPerson.companyId) {
          queryClient.invalidateQueries({
            queryKey: personKeys.byCompany(updatedPerson.companyId),
          });
        }
      }
      toast.success("Person updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update person");
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
      toast.success("Person deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete person");
    },
  });
}
