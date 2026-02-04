import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUsers, collaborations, projectMembers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const RESPONSIBLE_ROLE = "Project responsible" as const;
export const TEAM_MEMBER_ROLE = "Project team member" as const;

export type AuthContext = {
  userId: string;
  fullName: string;
  isAdmin: boolean;
};

export async function getAuthContext(request: NextRequest): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; status: number; error: string }
> {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, status: 403, error: "Not authenticated" };
  }

  const [me] = await db
    .select({
      id: appUsers.id,
      fullName: appUsers.fullName,
      isAdmin: appUsers.isAdmin,
      isLocked: appUsers.isLocked,
    })
    .from(appUsers)
    .where(eq(appUsers.id, userId))
    .limit(1);

  if (!me) {
    return { ok: false, status: 403, error: "User not found" };
  }

  if (me.isLocked) {
    return { ok: false, status: 403, error: "Account is locked" };
  }

  return {
    ok: true,
    ctx: {
      userId: me.id,
      fullName: me.fullName,
      isAdmin: !!me.isAdmin,
    },
  };
}

export async function isResponsibleOnAnyProject(userId: string) {
  const [row] = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(and(eq(projectMembers.appUserId, userId), eq(projectMembers.role, RESPONSIBLE_ROLE)))
    .limit(1);

  return !!row;
}

export async function getProjectRole(userId: string, projectId: number) {
  const [row] = await db
    .select({ role: projectMembers.role })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.appUserId, userId),
        eq(projectMembers.projectId, projectId)
      )
    )
    .limit(1);

  return (row?.role ?? null) as
    | typeof RESPONSIBLE_ROLE
    | typeof TEAM_MEMBER_ROLE
    | (string & {})
    | null;
}

export async function getTeamMemberProjectIds(userId: string) {
  const rows = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(
      and(eq(projectMembers.appUserId, userId), eq(projectMembers.role, TEAM_MEMBER_ROLE))
    );

  return rows.map((r) => r.projectId);
}

export async function getResponsibleProjectIds(userId: string) {
  const rows = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.appUserId, userId),
        eq(projectMembers.role, RESPONSIBLE_ROLE)
      )
    );

  return rows.map((r) => r.projectId);
}

export async function getResponsibleCompanyIdsByFullName(fullName: string) {
  const rows = await db
    .selectDistinct({ companyId: collaborations.companyId })
    .from(collaborations)
    .where(
      and(
        eq(collaborations.responsible, fullName),
        sql`${collaborations.companyId} IS NOT NULL`
      )
    );

  return rows
    .map((r) => r.companyId)
    .filter((id): id is number => typeof id === "number");
}
