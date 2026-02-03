"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectMemberService } from "@/services/project-member.service";
import { projectMemberKeys } from "./use-project-members";

export function useAddProjectMembers(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userIds: string[]) =>
      projectMemberService.addMembers(projectId, userIds),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: projectMemberKeys.byProject(projectId) });
      toast.success(`Added ${data.addedCount} member(s)`);
      if (data.invalidOrLocked?.length) {
        toast.error(`Skipped invalid/locked: ${data.invalidOrLocked.length}`);
      }
    },
    onError: () => {
      toast.error("Failed to add project members");
    },
  });
}
