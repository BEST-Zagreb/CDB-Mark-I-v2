import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collaborations, companies, people, appUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

// GET /api/collaborations/[id] - Get specific collaboration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collaborationId = parseInt(id);
    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        id: collaborations.id,
        companyId: collaborations.companyId,
        projectId: collaborations.projectId,
        contactId: collaborations.personId,
        responsible: collaborations.responsible,
        comment: collaborations.comment,
        contacted: collaborations.contacted,
        successful: collaborations.successful,
        letter: collaborations.letter,
        meeting: collaborations.meeting,
        priority: collaborations.priority,
        createdAt: collaborations.createdAt,
        updatedAt: collaborations.updatedAt,
        amount: collaborations.amount,
        contactInFuture: collaborations.contactInFuture,
        type: collaborations.type,
        companyName: companies.name,
        contactName: people.name,
        responsibleUserId: appUsers.id,
      })
      .from(collaborations)
      .leftJoin(companies, eq(collaborations.companyId, companies.id))
      .leftJoin(people, eq(collaborations.personId, people.id))
      .leftJoin(appUsers, eq(collaborations.responsible, appUsers.fullName))
      .where(eq(collaborations.id, collaborationId));

    const row = result[0];

    if (!row) {
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      );
    }

    const collaboration: Collaboration = {
      id: row.id,
      companyId: row.companyId ?? 0,
      projectId: row.projectId ?? 0,
      contactId: row.contactId,
      responsible: row.responsible,
      comment: row.comment,
      contacted: Boolean(row.contacted),
      successful: row.successful === null ? null : Boolean(row.successful),
      letter: Boolean(row.letter),
      meeting: row.meeting === null ? null : Boolean(row.meeting),
      priority: row.priority as "Low" | "Medium" | "High",
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
      amount: row.amount,
      contactInFuture:
        row.contactInFuture === null ? null : Boolean(row.contactInFuture),
      type: row.type,
      companyName: row.companyName ?? undefined,
      contactName: row.contactName ?? undefined,
      responsibleUserId: row.responsibleUserId ?? undefined,
    };

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collaborationId = parseInt(id);
    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    const data: CollaborationFormData = await request.json();
    const now = new Date().toISOString();

    const result = await db
      .update(collaborations)
      .set({
        companyId: data.companyId,
        projectId: data.projectId,
        personId: data.contactId || null,
        responsible: data.responsible || null,
        comment: data.comment || null,
        contacted: data.contacted ? 1 : 0,
        successful:
          data.successful !== undefined ? (data.successful ? 1 : 0) : null,
        letter: data.letter ? 1 : 0,
        meeting: data.meeting !== undefined ? (data.meeting ? 1 : 0) : null,
        priority: data.priority,
        amount: data.amount || null,
        contactInFuture:
          data.contactInFuture !== undefined
            ? data.contactInFuture
              ? 1
              : 0
            : null,
        type: data.type ?? null,
        updatedAt: now,
      })
      .where(eq(collaborations.id, collaborationId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      );
    }

    // Get the updated collaboration with related data
    const fullResult = await db
      .select({
        id: collaborations.id,
        companyId: collaborations.companyId,
        projectId: collaborations.projectId,
        contactId: collaborations.personId,
        responsible: collaborations.responsible,
        comment: collaborations.comment,
        contacted: collaborations.contacted,
        successful: collaborations.successful,
        letter: collaborations.letter,
        meeting: collaborations.meeting,
        priority: collaborations.priority,
        createdAt: collaborations.createdAt,
        updatedAt: collaborations.updatedAt,
        amount: collaborations.amount,
        contactInFuture: collaborations.contactInFuture,
        type: collaborations.type,
        companyName: companies.name,
        contactName: people.name,
        responsibleUserId: appUsers.id,
      })
      .from(collaborations)
      .leftJoin(companies, eq(collaborations.companyId, companies.id))
      .leftJoin(people, eq(collaborations.personId, people.id))
      .leftJoin(appUsers, eq(collaborations.responsible, appUsers.fullName))
      .where(eq(collaborations.id, collaborationId));

    const row = fullResult[0];

    const collaboration: Collaboration = {
      id: row.id,
      companyId: row.companyId ?? 0,
      projectId: row.projectId ?? 0,
      contactId: row.contactId,
      responsible: row.responsible,
      comment: row.comment,
      contacted: Boolean(row.contacted),
      successful: row.successful === null ? null : Boolean(row.successful),
      letter: Boolean(row.letter),
      meeting: row.meeting === null ? null : Boolean(row.meeting),
      priority: row.priority as "Low" | "Medium" | "High",
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
      amount: row.amount,
      contactInFuture:
        row.contactInFuture === null ? null : Boolean(row.contactInFuture),
      type: row.type,
      companyName: row.companyName ?? undefined,
      contactName: row.contactName ?? undefined,
      responsibleUserId: row.responsibleUserId ?? undefined,
    };

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collaborationId = parseInt(id);
    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(collaborations)
      .where(eq(collaborations.id, collaborationId))
      .returning();

    if (result.length === 0) {
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
