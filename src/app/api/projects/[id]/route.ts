import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import {
  updateProjectSchema,
  type ProjectDB,
  type Project,
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

    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM projects WHERE id = ?");
    const project: ProjectDB | undefined = stmt.get(projectId) as
      | ProjectDB
      | undefined;

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

    const db = getDatabase();

    // Check if project exists
    const checkStmt = db.prepare("SELECT id FROM projects WHERE id = ?");
    const existingProject = checkStmt.get(projectId);

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

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

    const updateStmt = db.prepare(`
      UPDATE projects 
      SET ${updateFields.join(", ")} 
      WHERE id = ?
    `);

    updateStmt.run(...updateValues);

    // Fetch and return the updated project
    const getStmt = db.prepare("SELECT * FROM projects WHERE id = ?");
    const updatedProject: ProjectDB = getStmt.get(projectId) as ProjectDB;

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

    const db = getDatabase();

    // Check if project exists before deletion
    const checkStmt = db.prepare("SELECT id FROM projects WHERE id = ?");
    const existingProject = checkStmt.get(projectId);

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deleteStmt = db.prepare("DELETE FROM projects WHERE id = ?");
    const result = deleteStmt.run(projectId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Failed to delete project" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Project deleted successfully" },
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
