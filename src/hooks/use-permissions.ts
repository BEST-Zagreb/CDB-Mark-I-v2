"use client";

import { useQuery } from "@tanstack/react-query";

export type Permissions = {
  userId: string;
  fullName: string;
  isAdmin: boolean;
  isResponsibleOnAnyProject: boolean;
  responsibleProjectIds: number[];
  teamMemberProjectIds: number[];
  responsibleCompanyIds: number[];
};

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async (): Promise<Permissions | null> => {
      const res = await fetch("/api/permissions");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}
