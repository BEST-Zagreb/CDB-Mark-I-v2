"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectMemberService } from "@/services/project-member.service";
import { projectMemberKeys } from "./use-project-members";

export function useRemoveProjectMembers(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userIds: string[]) =>
      projectMemberService.removeMembers(projectId, userIds),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectMemberKeys.byProject(projectId) });
      toast.success(`Removed ${data.deletedCount} member(s)`);
    },
    onError: () => {
      toast.error("Failed to remove project members");
    },
  });
}
