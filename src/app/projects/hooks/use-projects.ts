"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import { CreateProjectData, UpdateProjectData } from "@/types/project";
import { toast } from "sonner";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: number) => [...projectKeys.details(), id] as const,
};

// Custom hooks
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: projectService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => {
      return projectService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project created successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create project";
      toast.error(message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectData }) =>
      projectService.update(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      if (updatedProject?.id) {
        queryClient.setQueryData(
          projectKeys.detail(updatedProject.id),
          updatedProject
        );
      }
      toast.success("Project updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to update project";
      toast.error(message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return projectService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to delete project";
      toast.error(message);
    },
  });
}
