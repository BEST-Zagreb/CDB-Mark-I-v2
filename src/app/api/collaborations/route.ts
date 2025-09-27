import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import {
  Collaboration,
  CollaborationDB,
  CollaborationFormData,
} from "@/types/collaboration";

function transformCollaboration(
  dbCollaboration: CollaborationDB
): Collaboration {
  return {
    id: dbCollaboration.id,
    companyId: dbCollaboration.company_id,
    projectId: dbCollaboration.project_id,
    contactId: dbCollaboration.person_id,
    responsible: dbCollaboration.responsible,
    comment: dbCollaboration.comment,
    contacted: Boolean(dbCollaboration.contacted),
    successful:
      dbCollaboration.successful === null
        ? null
        : Boolean(dbCollaboration.successful),
    letter: Boolean(dbCollaboration.letter),
    meeting:
      dbCollaboration.meeting === null
        ? null
        : Boolean(dbCollaboration.meeting),
    priority: dbCollaboration.priority as "Low" | "Medium" | "High",
    createdAt: dbCollaboration.created_at
      ? new Date(dbCollaboration.created_at)
      : null,
    updatedAt: dbCollaboration.updated_at
      ? new Date(dbCollaboration.updated_at)
      : null,
    amount: dbCollaboration.amount,
    contactInFuture:
      dbCollaboration.contact_in_future === null
        ? null
        : Boolean(dbCollaboration.contact_in_future),
    type: dbCollaboration.type,
  };
}

// GET /api/collaborations - Get all collaborations with optional project or company filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const companyId = searchParams.get("company_id");

    const db = await getDatabase();

    let query = `
      SELECT c.*, companies.name as companyName, people.name as contactName, projects.name as projectName
      FROM collaborations c
      LEFT JOIN companies ON c.company_id = companies.id
      LEFT JOIN people ON c.person_id = people.id
      LEFT JOIN projects ON c.project_id = projects.id
    `;
    const params: (string | number)[] = [];

    if (projectId) {
      query += " WHERE c.project_id = ?";
      params.push(parseInt(projectId));
    } else if (companyId) {
      query += " WHERE c.company_id = ?";
      params.push(parseInt(companyId));
    }

    query += " ORDER BY c.updated_at DESC, c.created_at DESC";

    const result = await db.execute({
      sql: query,
      args: params,
    });

    const rows = result.rows as unknown as (CollaborationDB & {
      companyName?: string;
      contactName?: string;
      projectName?: string;
    })[];

    const collaborations = rows.map((row) => {
      const collaboration = transformCollaboration(row);
      collaboration.companyName = row.companyName || undefined;
      collaboration.contactName = row.contactName || undefined;
      collaboration.projectName = row.projectName || undefined;
      return collaboration;
    });

    return NextResponse.json(collaborations);
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaborations" },
      { status: 500 }
    );
  }
}

// POST /api/collaborations - Create a new collaboration
export async function POST(request: NextRequest) {
  try {
    const data: CollaborationFormData = await request.json();

    const db = await getDatabase();
    const now = new Date().toISOString();

    const insertQuery = `
      INSERT INTO collaborations (
        company_id, project_id, person_id, responsible, comment, contacted,
        successful, letter, meeting, priority, amount, contact_in_future,
        type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.execute({
      sql: insertQuery,
      args: [
        data.companyId,
        data.projectId,
        data.contactId || null,
        data.responsible || null,
        data.comment || null,
        data.contacted ? 1 : 0,
        data.successful !== undefined ? (data.successful ? 1 : 0) : null,
        data.letter ? 1 : 0,
        data.meeting !== undefined ? (data.meeting ? 1 : 0) : null,
        data.priority,
        data.amount || null,
        data.contactInFuture !== undefined
          ? data.contactInFuture
            ? 1
            : 0
          : null,
        data.type,
        now,
        now,
      ],
    });

    // Get the created collaboration with related data
    const getQuery = `
      SELECT c.*, companies.name as companyName, people.name as contactName, projects.name as projectName
      FROM collaborations c
      LEFT JOIN companies ON c.company_id = companies.id
      LEFT JOIN people ON c.person_id = people.id
      LEFT JOIN projects ON c.project_id = projects.id
      WHERE c.id = ?
    `;

    const getResult = await db.execute({
      sql: getQuery,
      args: [result.lastInsertRowid!],
    });

    const newRow = getResult.rows[0] as unknown as CollaborationDB & {
      companyName?: string;
      contactName?: string;
      projectName?: string;
    };

    const collaboration = transformCollaboration(newRow);
    collaboration.companyName = newRow.companyName || undefined;
    collaboration.contactName = newRow.contactName || undefined;
    collaboration.projectName = newRow.projectName || undefined;

    return NextResponse.json(collaboration, { status: 201 });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    return NextResponse.json(
      { error: "Failed to create collaboration" },
      { status: 500 }
    );
  }
}
