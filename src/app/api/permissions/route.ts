import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  getResponsibleCompanyIdsByFullName,
  getResponsibleProjectIds,
  getTeamMemberProjectIds,
  isResponsibleOnAnyProject,
} from "@/lib/rbac";

export type PermissionsResponse = {
  userId: string;
  fullName: string;
  isAdmin: boolean;
  isResponsibleOnAnyProject: boolean;
  responsibleProjectIds: number[];
  teamMemberProjectIds: number[];
  responsibleCompanyIds: number[];
};

export async function GET(request: NextRequest) {
  const authRes = await getAuthContext(request);
  if (!authRes.ok) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }

  const { ctx } = authRes;
  const [isResponsibleAny, responsibleProjectIds, teamMemberProjectIds, responsibleCompanyIds] =
    await Promise.all([
      isResponsibleOnAnyProject(ctx.userId),
      getResponsibleProjectIds(ctx.userId),
      getTeamMemberProjectIds(ctx.userId),
      getResponsibleCompanyIdsByFullName(ctx.fullName),
    ]);

  const response: PermissionsResponse = {
    userId: ctx.userId,
    fullName: ctx.fullName,
    isAdmin: ctx.isAdmin,
    isResponsibleOnAnyProject: isResponsibleAny,
    responsibleProjectIds,
    teamMemberProjectIds,
    responsibleCompanyIds,
  };

  return NextResponse.json(response);
}
