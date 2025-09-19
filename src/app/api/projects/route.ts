import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import {
  projectSchema,
  type ProjectDB,
  type Project,
  dbProjectToProject,
} from "@/types/project";

// GET /api/projects - Get all projects
export async function GET() {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM projects 
      ORDER BY 
        CASE WHEN created_at IS NULL OR created_at = 'null' THEN 1 ELSE 0 END,
        created_at DESC
    `);
    const projects: ProjectDB[] = stmt.all() as ProjectDB[];

    const formattedProjects: Project[] = projects.map(dbProjectToProject);

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

    const db = getDatabase();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO projects (name, created_at, updated_at)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(validatedData.name, now, now);

    if (result.lastInsertRowid) {
      // Fetch the created project
      const getStmt = db.prepare("SELECT * FROM projects WHERE id = ?");
      const newProject: ProjectDB = getStmt.get(
        result.lastInsertRowid
      ) as ProjectDB;

      return NextResponse.json(dbProjectToProject(newProject), { status: 201 });
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
