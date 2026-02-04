import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  collaborations,
  companies,
  people,
  projects,
  appUsers,
  projectMembers,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  Collaboration,
  BulkCollaborationFormData,
} from "@/types/collaboration";

import {
  getAuthContext,
  getProjectRole,
  RESPONSIBLE_ROLE,
  TEAM_MEMBER_ROLE,
} from "@/lib/rbac";

async function getBulkPermissions(request: NextRequest, projectId: number) {
  const authRes = await getAuthContext(request);
  if (!authRes.ok) {
    return { allowed: false as const, status: authRes.status, error: authRes.error };
  }

  const { ctx } = authRes;

  if (ctx.isAdmin) {
    return {
      allowed: true as const,
      userId: ctx.userId,
      fullName: ctx.fullName,
      isAdmin: true,
      canManageAll: true,
      canLimited: true,
      role: "Admin",
    };
  }

  const role = await getProjectRole(ctx.userId, projectId);
  const canManageAll = role === RESPONSIBLE_ROLE;
  const canLimited = role === TEAM_MEMBER_ROLE;

  if (!canManageAll && !canLimited) {
    return {
      allowed: false as const,
      status: 403,
      error: "Insufficient permissions",
    };
  }

  return {
    allowed: true as const,
    userId: ctx.userId,
    fullName: ctx.fullName,
    isAdmin: false,
    canManageAll,
    canLimited,
    role: role ?? "",
  };
}

type BulkIdsBody = {
  projectId: number;
  ids: number[];
};

type BulkSet = {
  responsible?: string | null;
  priority?: "Low" | "Medium" | "High";
  successful?: boolean | null;
  contacted?: boolean;
  letter?: boolean;
  meeting?: boolean | null;
};

type BulkUpdateBody = BulkIdsBody & {
  set?: BulkSet;
  appendComment?: string;
};

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

    const perms = await getBulkPermissions(request, data.projectId);
    if (!perms.allowed) {
      return NextResponse.json({ error: perms.error }, { status: perms.status });
    }

    if (!perms.canManageAll) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Team members never reach this endpoint; project responsibles can assign responsible freely.
    const responsibleValue =
      perms.isAdmin || perms.canManageAll
        ? (data.responsible ?? null)
        : perms.fullName;

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
      responsible: responsibleValue,
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
    const response: {
      collaborations: typeof formattedCollaborations;
      skippedCompanies?: string[];
      message?: string;
    } = {
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

// PUT /api/collaborations/bulk - Update multiple collaborations at once (scoped to a project)
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkUpdateBody;
    const projectId = Number(body.projectId);
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const uniqueIds = Array.from(
      new Set(ids.map((x) => Number(x)).filter((x) => Number.isFinite(x)))
    );

    if (uniqueIds.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    const perms = await getBulkPermissions(request, projectId);
    if (!perms.allowed) {
      return NextResponse.json({ error: perms.error }, { status: perms.status });
    }

    // Team members can only change: status/progress (successful/contacted/letter/meeting) and append comment.
    if (!perms.canManageAll) {
      const set = body.set ?? {};
      const setKeys = Object.keys(set);
      const allowedSetKeys = new Set([
        "successful",
        "contacted",
        "letter",
        "meeting",
      ]);

      const disallowedSetKeys = setKeys.filter((k) => !allowedSetKeys.has(k));
      if (disallowedSetKeys.length > 0) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    const existing = await db
      .select({
        id: collaborations.id,
        responsible: collaborations.responsible,
        comment: collaborations.comment,
      })
      .from(collaborations)
      .where(
        and(
          eq(collaborations.projectId, projectId),
          inArray(collaborations.id, uniqueIds)
        )
      );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "No collaborations found for given ids" },
        { status: 404 }
      );
    }

    const existingIds = new Set(existing.map((r) => r.id));
    const missingIds = uniqueIds.filter((id) => !existingIds.has(id));
    const idsToUpdate = uniqueIds.filter((id) => existingIds.has(id));

    if (!perms.isAdmin && !perms.canManageAll) {
      const allowedIds = new Set(
        existing
          .filter((r) => !!r.responsible && r.responsible === perms.fullName)
          .map((r) => r.id)
      );
      const forbiddenIds = idsToUpdate.filter((id) => !allowedIds.has(id));
      if (forbiddenIds.length > 0) {
        return NextResponse.json(
          { error: "Forbidden", forbiddenIds },
          { status: 403 }
        );
      }
    }

    const now = new Date().toISOString();
    const set = body.set;
    const hasSet = !!set && Object.keys(set).length > 0;

    if (hasSet) {
      const updateSet: Record<string, unknown> = { updatedAt: now };

      if (set?.responsible !== undefined) {
        updateSet.responsible = set.responsible;
      }
      if (set?.priority !== undefined) {
        updateSet.priority = set.priority;
      }
      if (set?.successful !== undefined) {
        updateSet.successful =
          set.successful === null ? null : set.successful ? 1 : 0;
      }
      if (set?.contacted !== undefined) {
        updateSet.contacted = set.contacted ? 1 : 0;
      }
      if (set?.letter !== undefined) {
        updateSet.letter = set.letter ? 1 : 0;
      }
      if (set?.meeting !== undefined) {
        updateSet.meeting = set.meeting === null ? null : set.meeting ? 1 : 0;
      }

      await db
        .update(collaborations)
        .set(updateSet)
        .where(
          and(
            eq(collaborations.projectId, projectId),
            inArray(collaborations.id, idsToUpdate)
          )
        );
    }

    const append = body.appendComment?.trim();
    if (append) {
      await db.transaction(async (tx) => {
        for (const row of existing) {
          if (!perms.isAdmin && !perms.canManageAll && row.responsible !== perms.fullName)
            continue;
          const current = (row.comment ?? "").toString();
          const nextComment = current
            ? `${current.replace(/\s+$/, "")}\n${append}`
            : append;

          await tx
            .update(collaborations)
            .set({ comment: nextComment, updatedAt: now })
            .where(
              and(
                eq(collaborations.projectId, projectId),
                eq(collaborations.id, row.id)
              )
            );
        }
      });
    }

    return NextResponse.json({ updatedCount: idsToUpdate.length, missingIds });
  } catch (error) {
    console.error("Error bulk updating collaborations:", error);
    return NextResponse.json(
      { error: "Failed to bulk update collaborations" },
      { status: 500 }
    );
  }
}

// DELETE /api/collaborations/bulk - Delete multiple collaborations at once (scoped to a project)
export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as BulkIdsBody;
    const projectId = Number(body.projectId);
    const ids = Array.isArray(body.ids) ? body.ids : [];

    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const uniqueIds = Array.from(
      new Set(ids.map((x) => Number(x)).filter((x) => Number.isFinite(x)))
    );

    if (uniqueIds.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    const perms = await getBulkPermissions(request, projectId);
    if (!perms.allowed) {
      return NextResponse.json({ error: perms.error }, { status: perms.status });
    }

    if (!perms.canManageAll) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    if (!perms.isAdmin && !perms.canManageAll) {
      const rows = await db
        .select({ id: collaborations.id, responsible: collaborations.responsible })
        .from(collaborations)
        .where(
          and(
            eq(collaborations.projectId, projectId),
            inArray(collaborations.id, uniqueIds)
          )
        );

      const allowedIds = new Set(
        rows
          .filter((r) => !!r.responsible && r.responsible === perms.fullName)
          .map((r) => r.id)
      );
      const forbiddenIds = uniqueIds.filter((id) => !allowedIds.has(id));
      if (forbiddenIds.length > 0) {
        return NextResponse.json(
          { error: "Forbidden", forbiddenIds },
          { status: 403 }
        );
      }
    }

    const deleted = await db
      .delete(collaborations)
      .where(
        and(
          eq(collaborations.projectId, projectId),
          inArray(collaborations.id, uniqueIds)
        )
      )
      .returning({ id: collaborations.id });

    const deletedIds = deleted.map((d) => d.id);
    const deletedIdSet = new Set(deletedIds);
    const missingIds = uniqueIds.filter((id) => !deletedIdSet.has(id));

    return NextResponse.json({ deletedCount: deletedIds.length, missingIds });
  } catch (error) {
    console.error("Error bulk deleting collaborations:", error);
    return NextResponse.json(
      { error: "Failed to bulk delete collaborations" },
      { status: 500 }
    );
  }
}
