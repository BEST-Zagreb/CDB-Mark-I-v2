"use client";

import { useQuery } from "@tanstack/react-query";

const RESPONSIBLE_ROLE = "Project responsible" as const;

type ProjectMemberItem = {
  projectId: number;
  appUserId: string;
  role: string;
  fullName: string;
  email: string;
};

type ProjectMembersResponse = {
  items: ProjectMemberItem[];
};

export function useProjectResponsible(projectId: number) {
  return useQuery<string | null>({
    queryKey: ["projectResponsible", projectId],
    queryFn: async () => {
      const url = `/api/project-members?projectId=${projectId}&role=${encodeURIComponent(
        RESPONSIBLE_ROLE
      )}`;

      const res = await fetch(url);
      if (!res.ok) return null;

      const data: ProjectMembersResponse = await res.json();
      return data.items[0]?.fullName ?? null;
    },
    enabled: !!projectId,
  });
}
