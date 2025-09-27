import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import {
  updateProjectSchema,
  type ProjectDB,
  dbProjectToProject,
} from "@/types/project";

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

    const db = await getDatabase();
    const result = await db.execute({
      sql: "SELECT * FROM projects WHERE id = ?",
      args: [projectId],
    });

    const project = result.rows[0] as unknown as ProjectDB | undefined;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(dbProjectToProject(project));
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

    const db = await getDatabase();

    // Check if project exists
    const checkResult = await db.execute({
      sql: "SELECT id FROM projects WHERE id = ?",
      args: [projectId],
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: (string | number | null)[] = [];

    if (validatedData.name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(validatedData.name);
    }

    if (validatedData.frGoal !== undefined) {
      updateFields.push("fr_goal = ?");
      updateValues.push(validatedData.frGoal);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Always update the updated_at timestamp
    updateFields.push("updated_at = ?");
    updateValues.push(new Date().toISOString());
    updateValues.push(projectId);

    const updateSql = `
      UPDATE projects
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;

    await db.execute({
      sql: updateSql,
      args: updateValues,
    });

    // Fetch and return the updated project
    const getResult = await db.execute({
      sql: "SELECT * FROM projects WHERE id = ?",
      args: [projectId],
    });

    const updatedProject = getResult.rows[0] as unknown as ProjectDB;

    return NextResponse.json(dbProjectToProject(updatedProject));
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

    const db = await getDatabase();

    // Check if project exists before deletion
    const checkResult = await db.execute({
      sql: "SELECT id FROM projects WHERE id = ?",
      args: [projectId],
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deleteResult = await db.execute({
      sql: "DELETE FROM projects WHERE id = ?",
      args: [projectId],
    });

    if (deleteResult.rowsAffected === 0) {
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }

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
