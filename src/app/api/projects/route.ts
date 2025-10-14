import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { projectSchema, type Project } from "@/types/project";

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

    const formattedProjects: Project[] = results.map((project) => {
      const parseDate = (dateStr: string | null): Date | null => {
        if (!dateStr || dateStr === "null") return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      return {
        id: project.id!,
        name: project.name || "",
        frGoal: project.frGoal,
        created_at: parseDate(project.createdAt),
        updated_at: parseDate(project.updatedAt),
      };
    });

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
    const body = await request.json();

    // Validate the request body
    const validatedData = projectSchema.parse(body);

    const now = new Date().toISOString();

    const result = await db
      .insert(projects)
      .values({
        name: validatedData.name,
        frGoal: validatedData.frGoal || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (result && result.length > 0) {
      const newProject = result[0];

      const parseDate = (dateStr: string | null): Date | null => {
        if (!dateStr || dateStr === "null") return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      const formattedProject: Project = {
        id: newProject.id!,
        name: newProject.name || "",
        frGoal: newProject.frGoal,
        created_at: parseDate(newProject.createdAt),
        updated_at: parseDate(newProject.updatedAt),
      };

      return NextResponse.json(formattedProject, { status: 201 });
    } else {
      throw new Error("Failed to create project");
    }
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
