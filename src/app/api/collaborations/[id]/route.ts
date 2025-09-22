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

// GET /api/collaborations/[id] - Get specific collaboration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    const db = new Database(dbPath, { readonly: true });
    const query = `
      SELECT c.*, companies.name as companyName, people.name as contactName
      FROM collaborations c
      LEFT JOIN companies ON c.company_id = companies.id
      LEFT JOIN people ON c.person_id = people.id
      WHERE c.id = ?
    `;

    const row = db.prepare(query).get(id) as
      | (CollaborationDB & { companyName?: string; contactName?: string })
      | undefined;
    db.close();

    if (!row) {
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      );
    }

    const collaboration = transformCollaboration(row);
    collaboration.companyName = row.companyName || undefined;
    collaboration.contactName = row.contactName || undefined;

    return NextResponse.json(collaboration);
  } catch (error) {
    console.error("Error fetching collaboration:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaboration" },
      { status: 500 }
    );
  }
}

// PUT /api/collaborations/[id] - Update collaboration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    const data: CollaborationFormData = await request.json();

    const db = new Database(dbPath);
    const now = new Date().toISOString();

    const updateQuery = `
      UPDATE collaborations SET
        company_id = ?, project_id = ?, person_id = ?, responsible = ?, 
        comment = ?, contacted = ?, successful = ?, letter = ?, meeting = ?, 
        priority = ?, amount = ?, contact_in_future = ?, type = ?, updated_at = ?
      WHERE id = ?
    `;

    const result = db
      .prepare(updateQuery)
      .run(
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
        id
      );

    if (result.changes === 0) {
      db.close();
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      );
    }

    // Get the updated collaboration with related data
    const getQuery = `
      SELECT c.*, companies.name as companyName, people.name as contactName
      FROM collaborations c
      LEFT JOIN companies ON c.company_id = companies.id
      LEFT JOIN people ON c.person_id = people.id
      WHERE c.id = ?
    `;

    const updatedRow = db.prepare(getQuery).get(id) as CollaborationDB & {
      companyName?: string;
      contactName?: string;
    };
    db.close();

    const collaboration = transformCollaboration(updatedRow);
    collaboration.companyName = updatedRow.companyName || undefined;
    collaboration.contactName = updatedRow.contactName || undefined;

    return NextResponse.json(collaboration);
  } catch (error) {
    console.error("Error updating collaboration:", error);
    return NextResponse.json(
      { error: "Failed to update collaboration" },
      { status: 500 }
    );
  }
}

// DELETE /api/collaborations/[id] - Delete collaboration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);
    const result = db
      .prepare("DELETE FROM collaborations WHERE id = ?")
      .run(id);
    db.close();

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Collaboration deleted successfully" });
  } catch (error) {
    console.error("Error deleting collaboration:", error);
    return NextResponse.json(
      { error: "Failed to delete collaboration" },
      { status: 500 }
    );
  }
}
