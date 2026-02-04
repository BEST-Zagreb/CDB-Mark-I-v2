import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collaborations, companies, people, appUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";
import {
  getAuthContext,
  getProjectRole,
  isResponsibleOnAnyProject,
  RESPONSIBLE_ROLE,
  TEAM_MEMBER_ROLE,
} from "@/lib/rbac";

// GET /api/collaborations/[id] - Get specific collaboration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authRes = await getAuthContext(request);
    if (!authRes.ok) {
      return NextResponse.json({ error: authRes.error }, { status: authRes.status });
    }
    const { ctx } = authRes;

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

    if (!ctx.isAdmin) {
      const responsibleAny = await isResponsibleOnAnyProject(ctx.userId);

      // Visibility: if user is responsible on any project, they can view all rows in any project.
      if (!responsibleAny) {
        const projectId = row.projectId ?? 0;
        const role = await getProjectRole(ctx.userId, projectId);

        if (role === RESPONSIBLE_ROLE) {
          // can view all
        } else if (role === TEAM_MEMBER_ROLE) {
          if (!row.responsible || row.responsible !== ctx.fullName) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
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
    const authRes = await getAuthContext(request);
    if (!authRes.ok) {
      return NextResponse.json({ error: authRes.error }, { status: authRes.status });
    }
    const { ctx } = authRes;

    const { id } = await params;
    const collaborationId = parseInt(id);
    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({
        id: collaborations.id,
        projectId: collaborations.projectId,
        companyId: collaborations.companyId,
        personId: collaborations.personId,
        responsible: collaborations.responsible,
        priority: collaborations.priority,
        amount: collaborations.amount,
        contactInFuture: collaborations.contactInFuture,
        type: collaborations.type,
      })
      .from(collaborations)
      .where(eq(collaborations.id, collaborationId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Collaboration not found" },
        { status: 404 }
      );
    }

    const projectId = existing.projectId ?? 0;

    let isLimitedTeamMember = false;
    if (!ctx.isAdmin) {
      const role = await getProjectRole(ctx.userId, projectId);

      if (role === RESPONSIBLE_ROLE) {
        // can update only own collaborations
        if (!existing.responsible || existing.responsible !== ctx.fullName) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (role === TEAM_MEMBER_ROLE) {
        if (!existing.responsible || existing.responsible !== ctx.fullName) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        // team members: allow only status/progress + comment
        isLimitedTeamMember = true;
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const data: CollaborationFormData = await request.json();
    const now = new Date().toISOString();

    if (isLimitedTeamMember) {
      const sameCompany = (data.companyId ?? null) === (existing.companyId ?? null);
      const sameProject = (data.projectId ?? null) === (existing.projectId ?? null);
      const sameContact = (data.contactId ?? null) === (existing.personId ?? null);
      const sameResponsible = (data.responsible ?? null) === (existing.responsible ?? null);
      const samePriority = (data.priority ?? null) === (existing.priority ?? null);
      const sameAmount = (data.amount ?? null) === (existing.amount ?? null);
      const sameContactInFuture = (data.contactInFuture ?? null) === (existing.contactInFuture ?? null);
      const sameType = (data.type ?? null) === (existing.type ?? null);

      if (
        !sameCompany ||
        !sameProject ||
        !sameContact ||
        !sameResponsible ||
        !samePriority ||
        !sameAmount ||
        !sameContactInFuture ||
        !sameType
      ) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    const result = await db
      .update(collaborations)
      .set({
        companyId: isLimitedTeamMember ? (existing.companyId ?? null) : data.companyId,
        projectId: isLimitedTeamMember ? (existing.projectId ?? null) : data.projectId,
        personId: isLimitedTeamMember
          ? (existing.personId ?? null)
          : data.contactId || null,
        responsible: isLimitedTeamMember
          ? (existing.responsible ?? null)
          : data.responsible || null,
        comment: data.comment || null,
        contacted: data.contacted ? 1 : 0,
        successful:
          data.successful === null || data.successful === undefined
            ? null
            : data.successful
            ? 1
            : 0,
        letter: data.letter ? 1 : 0,
        meeting: data.meeting !== undefined ? (data.meeting ? 1 : 0) : null,
        priority: isLimitedTeamMember ? (existing.priority ?? null) : data.priority,
        amount: isLimitedTeamMember ? (existing.amount ?? null) : data.amount || null,
        contactInFuture: isLimitedTeamMember
          ? (existing.contactInFuture ?? null)
          : data.contactInFuture !== undefined
          ? data.contactInFuture
            ? 1
            : 0
          : null,
        type: isLimitedTeamMember ? (existing.type ?? null) : data.type ?? null,
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
    const authRes = await getAuthContext(request);
    if (!authRes.ok) {
      return NextResponse.json({ error: authRes.error }, { status: authRes.status });
    }
    const { ctx } = authRes;

    const { id } = await params;
    const collaborationId = parseInt(id);
    if (isNaN(collaborationId)) {
      return NextResponse.json(
        { error: "Invalid collaboration ID" },
        { status: 400 }
      );
    }

    if (!ctx.isAdmin) {
      const [row] = await db
        .select({ projectId: collaborations.projectId, responsible: collaborations.responsible })
        .from(collaborations)
        .where(eq(collaborations.id, collaborationId))
        .limit(1);

      if (!row) {
        return NextResponse.json(
          { error: "Collaboration not found" },
          { status: 404 }
        );
      }

      const role = await getProjectRole(ctx.userId, row.projectId ?? 0);
      if (role !== RESPONSIBLE_ROLE) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!row.responsible || row.responsible !== ctx.fullName) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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
