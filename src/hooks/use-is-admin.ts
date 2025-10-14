"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { UserRole } from "@/types/user";

/**
 * Hook to check if the current user is an administrator
 * @returns boolean indicating if user is admin, or null if loading/not authenticated
 */
export function useIsAdmin() {
  const { data: session, isPending: sessionPending } = useSession();

  const { data: userData, isPending: userPending } = useQuery({
    queryKey: ["user", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const response = await fetch(`/api/users/${session.user.id}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

  const isPending = sessionPending || userPending;
  const isAdmin = userData?.role === UserRole.ADMINISTRATOR;

  return { isAdmin, isPending };
}
