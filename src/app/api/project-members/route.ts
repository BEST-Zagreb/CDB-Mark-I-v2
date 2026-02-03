import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // koristi se za getSession
import { db } from "@/lib/db";
import { appUsers, projectMembers, projects } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

const RESPONSIBLE_ROLE = "Project responsible" as const;
const TEAM_MEMBER_ROLE = "Project team member" as const;

const addProjectMembersSchema = z.object({
  projectId: z.number().int().positive(),
  userIds: z.array(z.string().min(1)).min(1, "Select at least one user"),
});


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

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 403 });
    }

    const body = await request.json();
    const validated = addProjectMembersSchema.parse(body);

    // 1) check if project exists
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, validated.projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2) check current user (locked + isAdmin)
    const [me] = await db
      .select({ id: appUsers.id, isAdmin: appUsers.isAdmin, isLocked: appUsers.isLocked })
      .from(appUsers)
      .where(eq(appUsers.id, currentUserId))
      .limit(1);

    if (!me || me.isLocked) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const isAdmin = !!me.isAdmin;

    // 3) if not admin, user needs to be project responsible
    if (!isAdmin) {
      const [responsibleRow] = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, validated.projectId),
            eq(projectMembers.appUserId, currentUserId),
            eq(projectMembers.role, RESPONSIBLE_ROLE)
          )
        )
        .limit(1);

      if (!responsibleRow) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    // 4) validate target users (exists and not locked)
    const targetUsers = await db
      .select({ id: appUsers.id, isLocked: appUsers.isLocked })
      .from(appUsers)
      .where(inArray(appUsers.id, validated.userIds));

    const validUserIds = targetUsers
      .filter((u) => !u.isLocked)
      .map((u) => u.id);

    const invalidOrLocked = validated.userIds.filter(
      (id) => !validUserIds.includes(id)
    );

    if (validUserIds.length === 0) {
      return NextResponse.json(
        { error: "No valid users to add", invalidOrLocked },
        { status: 400 }
      );
    }

    // 5) insert (ignore duplicates)
    const inserted = await db
      .insert(projectMembers)
      .values(
        validUserIds.map((id) => ({
          projectId: validated.projectId,
          appUserId: id,
          role: TEAM_MEMBER_ROLE,
        }))
      )
      .onConflictDoNothing()
      .returning({ appUserId: projectMembers.appUserId });

    return NextResponse.json({
      addedCount: inserted.length,
      addedUserIds: inserted.map((r) => r.appUserId),
      skippedCount: validUserIds.length - inserted.length,
      invalidOrLocked,
    });
  } catch (error) {
    console.error("Error adding project members:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request", details: error }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to add project members" },
      { status: 500 }
    );
  }
}

