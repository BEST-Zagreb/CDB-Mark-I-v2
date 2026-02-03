"use client";

import { useQuery } from "@tanstack/react-query";
import { projectMemberService } from "@/services/project-member.service";

export const projectMemberKeys = {
  all: ["projectMembers"] as const,
  byProject: (projectId: number) =>
    [...projectMemberKeys.all, projectId] as const,
};

export function useProjectMembers(projectId: number) {
  return useQuery({
    queryKey: projectMemberKeys.byProject(projectId),
    queryFn: async () => {
      const data = await projectMemberService.getByProject(projectId);
      return data.items;
    },
    enabled: !!projectId,
  });
}
