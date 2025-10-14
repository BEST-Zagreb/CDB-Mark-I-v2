import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateProjectSchema, type Project } from "@/types/project";

// Helper function to parse dates
function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  return new Date(dateString);
}

// GET /api/projects/[id] - Get a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    const project = result[0];

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formattedProject: Project = {
      id: project.id,
      name: project.name ?? "",
      frGoal: project.frGoal ?? 0,
      created_at: parseDate(project.createdAt),
      updated_at: parseDate(project.updatedAt),
    };

    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = updateProjectSchema.parse(body);

    // Check if project exists
    const checkResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (checkResult.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build update object dynamically
    const updateData: Partial<typeof projects.$inferInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.frGoal !== undefined) {
      updateData.frGoal = validatedData.frGoal;
    }

    // Perform the update
    const result = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    const updatedProject = result[0];

    const formattedProject: Project = {
      id: updatedProject.id,
      name: updatedProject.name ?? "",
      frGoal: updatedProject.frGoal ?? 0,
      created_at: parseDate(updatedProject.createdAt),
      updated_at: parseDate(updatedProject.updatedAt),
    };

    return NextResponse.json(formattedProject);
  } catch (error) {
    console.error("Error updating project:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid project data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a specific project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Check if project exists before deletion
    const checkResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (checkResult.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete the project (cascading deletes will handle related records)
    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json(
      { message: "Project and all associated data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
