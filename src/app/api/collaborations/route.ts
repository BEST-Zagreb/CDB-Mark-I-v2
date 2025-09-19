import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import {
  Collaboration,
  CollaborationDB,
  CollaborationFormData,
} from "@/types/collaboration";

const dbPath = path.join(process.cwd(), "db", "cdb.sqlite3");

function transformCollaboration(
  dbCollaboration: CollaborationDB
): Collaboration {
  return {
    id: dbCollaboration.id,
    companyId: dbCollaboration.company_id,
    projectId: dbCollaboration.project_id,
    personId: dbCollaboration.person_id,
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
    priority: dbCollaboration.priority,
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

// GET /api/collaborations - Get all collaborations with optional project filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");

    const db = new Database(dbPath, { readonly: true });

    let query = `
      SELECT c.*, companies.name as companyName, people.name as personName
      FROM collaborations c
      LEFT JOIN companies ON c.company_id = companies.id
      LEFT JOIN people ON c.person_id = people.id
    `;
    const params: any[] = [];

    if (projectId) {
      query += " WHERE c.project_id = ?";
      params.push(parseInt(projectId));
    }

    query += " ORDER BY c.updated_at DESC, c.created_at DESC";

    const rows = db.prepare(query).all(...params) as (CollaborationDB & {
      companyName?: string;
      personName?: string;
    })[];
    db.close();

    const collaborations = rows.map((row) => {
      const collaboration = transformCollaboration(row);
      collaboration.companyName = row.companyName || undefined;
      collaboration.personName = row.personName || undefined;
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

    const db = new Database(dbPath);
    const now = new Date().toISOString();

    const insertQuery = `
      INSERT INTO collaborations (
        company_id, project_id, person_id, responsible, comment, contacted, 
        successful, letter, meeting, priority, amount, contact_in_future, 
        type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db
      .prepare(insertQuery)
      .run(
        data.companyId,
        data.projectId,
        data.personId || null,
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
        now
      );

    // Get the created collaboration with related data
    const getQuery = `
      SELECT c.*, companies.name as companyName, people.name as personName
      FROM collaborations c
      LEFT JOIN companies ON c.company_id = companies.id
      LEFT JOIN people ON c.person_id = people.id
      WHERE c.id = ?
    `;

    const newRow = db
      .prepare(getQuery)
      .get(result.lastInsertRowid) as CollaborationDB & {
      companyName?: string;
      personName?: string;
    };
    db.close();

    const collaboration = transformCollaboration(newRow);
    collaboration.companyName = newRow.companyName || undefined;
    collaboration.personName = newRow.personName || undefined;

    return NextResponse.json(collaboration, { status: 201 });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    return NextResponse.json(
      { error: "Failed to create collaboration" },
      { status: 500 }
    );
  }
}
