import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  collaborations,
  companies,
  people,
  projects,
  appUsers,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  Collaboration,
  BulkCollaborationFormData,
} from "@/types/collaboration";

// POST /api/collaborations/bulk - Create multiple collaborations at once
export async function POST(request: NextRequest) {
  try {
    const data: BulkCollaborationFormData = await request.json();
    const now = new Date().toISOString();

    // Validate that we have at least one company
    if (!data.companyIds || data.companyIds.length === 0) {
      return NextResponse.json(
        { error: "At least one company is required" },
        { status: 400 }
      );
    }

    // Check for existing collaborations
    const existingCollaborations = await db
      .select({
        companyId: collaborations.companyId,
        projectId: collaborations.projectId,
      })
      .from(collaborations)
      .where(
        and(
          inArray(collaborations.companyId, data.companyIds),
          eq(collaborations.projectId, data.projectId)
        )
      );

    const existingCompanyIds = new Set(
      existingCollaborations
        .map((c) => c.companyId)
        .filter((id): id is number => id !== null)
    );

    // Filter out companies that already have collaborations
    const newCompanyIds = data.companyIds.filter(
      (id) => !existingCompanyIds.has(id)
    );

    // If all companies already have collaborations, return error
    if (newCompanyIds.length === 0) {
      // Get company names for error message
      const existingCompanies = await db
        .select({ name: companies.name })
        .from(companies)
        .where(inArray(companies.id, data.companyIds));

      return NextResponse.json(
        {
          error:
            "All selected companies already have collaborations for this project",
          existing: true,
          existingCompanies: existingCompanies.map((c) => c.name),
        },
        { status: 409 }
      );
    }

    // If some companies already exist, we'll create for the rest and notify
    let skippedCompanyNames: string[] = [];
    if (existingCompanyIds.size > 0) {
      const existingIdsArray = Array.from(existingCompanyIds);
      const skippedCompanies = await db
        .select({ name: companies.name })
        .from(companies)
        .where(inArray(companies.id, existingIdsArray));

      skippedCompanyNames = skippedCompanies.map((c) => c.name ?? "Unknown");
    }

    // Create collaboration entries for each company
    const collaborationEntries = newCompanyIds.map((companyId) => ({
      companyId,
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
    }));

    // Insert all collaborations
    const result = await db
      .insert(collaborations)
      .values(collaborationEntries)
      .returning();

    // Get the IDs of inserted collaborations
    const insertedIds = result.map((collab) => collab.id);

    // Fetch full data for all inserted collaborations
    const fullResults = await Promise.all(
      insertedIds.map(async (id) => {
        const rows = await db
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
          .where(eq(collaborations.id, id));

        return rows[0];
      })
    );

    // Transform to UI format
    const formattedCollaborations: Collaboration[] = fullResults.map((row) => ({
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
    }));

    // Return the created collaborations along with any skipped companies info
    const response: any = {
      collaborations: formattedCollaborations,
    };

    if (skippedCompanyNames.length > 0) {
      response.skippedCompanies = skippedCompanyNames;
      response.message = `Created ${formattedCollaborations.length} collaboration(s). Skipped 1 or more companies that already had collaborations on this project.`;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating bulk collaborations:", error);
    return NextResponse.json(
      { error: "Failed to create bulk collaborations" },
      { status: 500 }
    );
  }
}
