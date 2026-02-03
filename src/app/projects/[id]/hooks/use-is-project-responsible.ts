"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { projectMemberService } from "@/services/project-member.service";

const RESPONSIBLE_ROLE = "Project responsible" as const;

export function useIsProjectResponsible(projectId: number) {
  const { data: session, isPending: sessionPending } = useSession();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: ["isProjectResponsible", projectId, userId],
    queryFn: async () => {
      if (!userId) return false;
      const data = await projectMemberService.getByProject(
        projectId,
        RESPONSIBLE_ROLE
      );
      return data.items.some((m) => m.appUserId === userId);
    },
    enabled: !!projectId && !!userId,
  });

  return {
    isResponsible: !!query.data,
    isPending: sessionPending || query.isPending,
  };
}
