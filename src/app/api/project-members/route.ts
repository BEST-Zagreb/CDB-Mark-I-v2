import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers, projectMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const projectIdRaw = searchParams.get("projectId");
    const role = searchParams.get("role"); // optional

    if (!projectIdRaw) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const projectId = parseInt(projectIdRaw, 10);
    if (Number.isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    const whereClause = role
      ? and(eq(projectMembers.projectId, projectId), eq(projectMembers.role, role))
      : eq(projectMembers.projectId, projectId);

    const rows = await db
      .select({
        projectId: projectMembers.projectId,
        appUserId: projectMembers.appUserId,
        role: projectMembers.role,
        fullName: appUsers.fullName,
        email: appUsers.email,
      })
      .from(projectMembers)
      .innerJoin(appUsers, eq(projectMembers.appUserId, appUsers.id))
      .where(whereClause);

    return NextResponse.json({ items: rows });
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}
