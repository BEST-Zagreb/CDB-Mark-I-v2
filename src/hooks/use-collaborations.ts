"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collaborationService } from "@/services/collaboration.service";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";
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
      toast.success("Collaboration created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create collaboration");
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
      }
      toast.success("Collaboration updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update collaboration");
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete collaboration");
    },
  });
}
