import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers, projectMembers, projects } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { createProjectSchema, type Project } from "@/types/project";
import { checkIsAdmin } from "@/lib/server-auth";

const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr || dateStr === "null") return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const results = await db
      .select()
      .from(projects)
      .orderBy(
        sql`CASE WHEN ${projects.createdAt} IS NULL OR ${projects.createdAt} = 'null' THEN 1 ELSE 0 END`,
        desc(projects.createdAt)
      );

    const formattedProjects: Project[] = results.map((project) => ({
      id: project.id!,
      name: project.name || "",
      frGoal: project.frGoal,
      created_at: parseDate(project.createdAt),
      updated_at: parseDate(project.updatedAt),
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    // Check if user is an administrator
    const authCheck = await checkIsAdmin(request);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error || "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the request body (expects responsibleUserId here)
    const validatedData = createProjectSchema.parse(body);

    // Optional: verify responsible user exists and is not locked
    const [responsible] = await db
      .select({ id: appUsers.id, isLocked: appUsers.isLocked })
      .from(appUsers)
      .where(eq(appUsers.id, validatedData.responsibleUserId))
      .limit(1);

    if (!responsible || responsible.isLocked) {
      return NextResponse.json(
        { error: "Invalid project responsible user" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newProject = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(projects)
        .values({
          name: validatedData.name,
          frGoal: validatedData.frGoal || null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      if (!inserted || inserted.length === 0) {
        throw new Error("Failed to create project");
      }

      const project = inserted[0];

      await tx.insert(projectMembers).values({
        projectId: project.id!,
        appUserId: validatedData.responsibleUserId,
        role: "Project responsible",
      });

      return project;
    });

    const formattedProject: Project = {
      id: newProject.id!,
      name: newProject.name || "",
      frGoal: newProject.frGoal,
      created_at: parseDate(newProject.createdAt),
      updated_at: parseDate(newProject.updatedAt),
    };

    return NextResponse.json(formattedProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid project data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
