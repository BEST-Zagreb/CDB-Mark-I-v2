import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  collaborations,
  companies,
  people,
  projects,
  appUsers,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

// GET /api/collaborations - Get collaborations with required project, company, or responsible filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const companyId = searchParams.get("company_id");
    const responsible = searchParams.get("responsible");

    // Require at least one filter to prevent fetching all collaborations
    if (!projectId && !companyId && !responsible) {
      return NextResponse.json(
        {
          error:
            "Filter required: Please provide project_id, company_id, or responsible parameter",
        },
        { status: 400 }
      );
    }

    const baseQuery = db
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
        projectName: projects.name,
        responsibleUserId: appUsers.id,
      })
      .from(collaborations)
      .leftJoin(companies, eq(collaborations.companyId, companies.id))
      .leftJoin(people, eq(collaborations.personId, people.id))
      .leftJoin(projects, eq(collaborations.projectId, projects.id))
      .leftJoin(appUsers, eq(collaborations.responsible, appUsers.fullName));

    let result;
    if (projectId) {
      result = await baseQuery
        .where(eq(collaborations.projectId, parseInt(projectId)))
        .orderBy(
          desc(collaborations.updatedAt),
          desc(collaborations.createdAt)
        );
    } else if (companyId) {
      result = await baseQuery
        .where(eq(collaborations.companyId, parseInt(companyId)))
        .orderBy(
          desc(collaborations.updatedAt),
          desc(collaborations.createdAt)
        );
    } else {
      // responsible filter (guaranteed to be non-null due to check above)
      result = await baseQuery
        .where(eq(collaborations.responsible, responsible!))
        .orderBy(
          desc(collaborations.updatedAt),
          desc(collaborations.createdAt)
        );
    }

    // For project and user views, check if any company has "do not contact" status
    let doNotContactCompanyIds: Set<number> = new Set();
    if (projectId || responsible) {
      const doNotContactCompanies = await db
        .selectDistinct({
          companyId: collaborations.companyId,
        })
        .from(collaborations)
        .where(eq(collaborations.contactInFuture, 0))
        .groupBy(collaborations.companyId);

      doNotContactCompanyIds = new Set(
        doNotContactCompanies
          .map((row) => row.companyId)
          .filter((id): id is number => id !== null)
      );
    }

    const formattedCollaborations: Collaboration[] = result.map((row) => {
      // Check if this company is marked as "do not contact" in ANY collaboration
      const companyHasDoNotContact =
        (projectId || responsible) &&
        doNotContactCompanyIds.has(row.companyId ?? 0);

      return {
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
        // Keep the actual collaboration's contactInFuture value
        contactInFuture:
          row.contactInFuture === null ? null : Boolean(row.contactInFuture),
        type: row.type,
        companyName: row.companyName ?? undefined,
        contactName: row.contactName ?? undefined,
        projectName: row.projectName ?? undefined,
        responsibleUserId: row.responsibleUserId ?? undefined,
        // Add warning flag if company has "do not contact" status
        companyHasDoNotContact: companyHasDoNotContact || undefined,
      };
    });

    return NextResponse.json(formattedCollaborations);
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

    // Check if collaboration already exists
    const existingCollaboration = await db
      .select()
      .from(collaborations)
      .where(
        and(
          eq(collaborations.companyId, data.companyId),
          eq(collaborations.projectId, data.projectId)
        )
      )
      .limit(1);

    if (existingCollaboration.length > 0) {
      return NextResponse.json(
        {
          error:
            "Collaboration between this company and project already exists",
          existing: true,
        },
        { status: 409 } // Conflict status code
      );
    }

    const now = new Date().toISOString();

    const result = await db
      .insert(collaborations)
      .values({
        companyId: data.companyId,
        projectId: data.projectId,
        personId: data.contactId || null,
        responsible: data.responsible || null,
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
        priority: data.priority,
        amount: data.amount || null,
        contactInFuture:
          data.contactInFuture !== undefined
            ? data.contactInFuture
              ? 1
              : 0
            : null,
        type: data.type ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const insertedCollab = result[0];

    // Get related data
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
        projectName: projects.name,
        responsibleUserId: appUsers.id,
      })
      .from(collaborations)
      .leftJoin(companies, eq(collaborations.companyId, companies.id))
      .leftJoin(people, eq(collaborations.personId, people.id))
      .leftJoin(projects, eq(collaborations.projectId, projects.id))
      .leftJoin(appUsers, eq(collaborations.responsible, appUsers.fullName))
      .where(eq(collaborations.id, insertedCollab.id));

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
      projectName: row.projectName ?? undefined,
      responsibleUserId: row.responsibleUserId ?? undefined,
    };

    return NextResponse.json(collaboration, { status: 201 });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    return NextResponse.json(
      { error: "Failed to create collaboration" },
      { status: 500 }
    );
  }
}
