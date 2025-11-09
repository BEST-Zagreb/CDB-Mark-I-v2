"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collaborationService } from "@/services/collaboration.service";
import {
  CollaborationFormData,
  BulkCollaborationFormData,
} from "@/types/collaboration";
import { toast } from "sonner";

// Query keys
export const collaborationKeys = {
  all: ["collaborations"] as const,
  lists: () => [...collaborationKeys.all, "list"] as const,
  list: (filters?: { projectId?: number; companyId?: number }) =>
    [...collaborationKeys.lists(), { filters }] as const,
  details: () => [...collaborationKeys.all, "detail"] as const,
  detail: (id: number) => [...collaborationKeys.details(), id] as const,
  byProject: (projectId: number) =>
    [...collaborationKeys.all, "project", projectId] as const,
  byCompany: (companyId: number) =>
    [...collaborationKeys.all, "company", companyId] as const,
  byResponsible: (responsible: string) =>
    [...collaborationKeys.all, "responsible", responsible] as const,
};

// Custom hooks
export function useCollaborations() {
  return useQuery({
    queryKey: collaborationKeys.list(),
    queryFn: () => collaborationService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCollaborationsByProject(projectId: number) {
  return useQuery({
    queryKey: collaborationKeys.byProject(projectId),
    queryFn: () => collaborationService.getByProject(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCollaborationsByCompany(companyId: number) {
  return useQuery({
    queryKey: collaborationKeys.byCompany(companyId),
    queryFn: () => collaborationService.getByCompany(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCollaborationsByResponsible(responsible: string) {
  return useQuery({
    queryKey: collaborationKeys.byResponsible(responsible),
    queryFn: () => collaborationService.getByResponsible(responsible),
    enabled: !!responsible,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCollaboration(id: number) {
  return useQuery({
    queryKey: collaborationKeys.detail(id),
    queryFn: () => collaborationService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CollaborationFormData) => {
      return collaborationService.create(data);
    },
    onSuccess: (newCollaboration) => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.all });
      // Invalidate project and company specific queries
      if (newCollaboration?.projectId) {
        queryClient.invalidateQueries({
          queryKey: collaborationKeys.byProject(newCollaboration.projectId),
        });
      }
      if (newCollaboration?.companyId) {
        queryClient.invalidateQueries({
          queryKey: collaborationKeys.byCompany(newCollaboration.companyId),
        });
      }
      // Invalidate responsible person specific queries
      if (newCollaboration?.responsible) {
        queryClient.invalidateQueries({
          queryKey: collaborationKeys.byResponsible(
            newCollaboration.responsible
          ),
        });
      }
      toast.success("Collaboration created successfully");
    },
    onError: (error: any) => {
      // Check if it's a conflict error (collaboration already exists)
      if (error.response?.status === 409) {
        toast.error(
          error.response?.data?.error ||
            "Collaboration between this company and project already exists"
        );
      } else {
        const message =
          error.response?.data?.error ||
          error.message ||
          "Failed to create collaboration";
        toast.error(message);
      }
    },
  });
}

export function useUpdateCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CollaborationFormData }) =>
      collaborationService.update(id, data),
    onSuccess: (updatedCollaboration) => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.all });
      if (updatedCollaboration?.id) {
        queryClient.setQueryData(
          collaborationKeys.detail(updatedCollaboration.id),
          updatedCollaboration
        );
        // Invalidate project and company specific queries
        if (updatedCollaboration.projectId) {
          queryClient.invalidateQueries({
            queryKey: collaborationKeys.byProject(
              updatedCollaboration.projectId
            ),
          });
        }
        if (updatedCollaboration.companyId) {
          queryClient.invalidateQueries({
            queryKey: collaborationKeys.byCompany(
              updatedCollaboration.companyId
            ),
          });
        }
        // Invalidate responsible person specific queries
        if (updatedCollaboration.responsible) {
          queryClient.invalidateQueries({
            queryKey: collaborationKeys.byResponsible(
              updatedCollaboration.responsible
            ),
          });
        }
      }
      toast.success("Collaboration updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update collaboration";
      toast.error(message);
    },
  });
}

export function useDeleteCollaboration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return collaborationService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaborationKeys.all });
      toast.success("Collaboration deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete collaboration";
      toast.error(message);
    },
  });
}

export function useResponsiblePersons() {
  return useQuery({
    queryKey: ["collaborations", "responsible"],
    queryFn: collaborationService.getResponsiblePersons,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateBulkCollaborations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCollaborationFormData) => {
      return collaborationService.createBulk(data);
    },
    onSuccess: (response) => {
      const newCollaborations = response.collaborations;

      queryClient.invalidateQueries({ queryKey: collaborationKeys.all });
      // Invalidate project and company specific queries
      if (newCollaborations && newCollaborations.length > 0) {
        const projectId = newCollaborations[0].projectId;
        if (projectId) {
          queryClient.invalidateQueries({
            queryKey: collaborationKeys.byProject(projectId),
          });
        }
        // Invalidate each company's queries
        newCollaborations.forEach((collab) => {
          if (collab.companyId) {
            queryClient.invalidateQueries({
              queryKey: collaborationKeys.byCompany(collab.companyId),
            });
          }
        });
        // Invalidate responsible person specific queries
        const responsible = newCollaborations[0].responsible;
        if (responsible) {
          queryClient.invalidateQueries({
            queryKey: collaborationKeys.byResponsible(responsible),
          });
        }
      }

      // Show appropriate success message
      if (response.message) {
        // Some companies were skipped
        toast.success(response.message);
        if (response.skippedCompanies && response.skippedCompanies.length > 0) {
          toast.info(
            `Skipped companies: ${response.skippedCompanies.join(", ")}`
          );
        }
      } else {
        toast.success(
          `${newCollaborations.length} collaboration${
            newCollaborations.length === 1 ? "" : "s"
          } created successfully`
        );
      }
    },
    onError: (error: any) => {
      // Check if it's a conflict error (all companies already exist)
      if (error.response?.status === 409) {
        const errorData = error.response?.data;
        if (
          errorData?.existingCompanies &&
          errorData.existingCompanies.length > 0
        ) {
          toast.error(
            `${errorData.error}: ${errorData.existingCompanies.join(", ")}`
          );
        } else {
          toast.error(
            errorData?.error ||
              "All selected companies already have collaborations for this project"
          );
        }
      } else {
        const message =
          error.response?.data?.error ||
          error.message ||
          "Failed to create bulk collaborations";
        toast.error(message);
      }
    },
  });
}
