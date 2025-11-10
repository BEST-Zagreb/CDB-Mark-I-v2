import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collaborations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CopyCollaborationFormData } from "@/types/collaboration";

// POST /api/collaborations/copy - Copy collaborations from one project to another
export async function POST(request: NextRequest) {
  try {
    const data: CopyCollaborationFormData & { sourceProjectId: number } =
      await request.json();

    const {
      sourceProjectId,
      projectId: targetProjectId,
      copyCompany,
      copyContactPerson,
      copyType,
      copyPriority,
      copyContactInFuture,
      copyResponsible,
      copyComment,
      copyProgress,
      copyStatus,
      copyAmount,
    } = data;

    // Validate that source and target projects are different
    if (sourceProjectId === targetProjectId) {
      return NextResponse.json(
        { error: "Source and target projects must be different" },
        { status: 400 }
      );
    }

    // Fetch all collaborations from the source project
    const sourceCollaborations = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.projectId, sourceProjectId));

    if (sourceCollaborations.length === 0) {
      return NextResponse.json(
        { error: "No collaborations found in source project" },
        { status: 404 }
      );
    }

    // Check for existing collaborations in target project with same companies
    const existingCollaborations = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.projectId, targetProjectId));

    const existingCompanyIds = new Set(
      existingCollaborations.map((c) => c.companyId)
    );

    // Filter out collaborations where the company already exists in target project
    const collaborationsToCreate = sourceCollaborations.filter(
      (collab) => !existingCompanyIds.has(collab.companyId)
    );

    if (collaborationsToCreate.length === 0) {
      return NextResponse.json(
        {
          error:
            "All companies from source project already have collaborations in target project",
          skipped: sourceCollaborations.length,
        },
        { status: 400 }
      );
    }

    // Prepare collaborations to insert
    const newCollaborations = collaborationsToCreate.map((sourceCollab) => ({
      companyId: copyCompany ? sourceCollab.companyId : 0, // Should always be true
      projectId: targetProjectId,
      personId: copyContactPerson ? sourceCollab.personId : null,
      responsible: copyResponsible ? sourceCollab.responsible : null,
      comment: copyComment ? sourceCollab.comment : null,
      contacted: copyProgress ? sourceCollab.contacted : 0,
      letter: copyProgress ? sourceCollab.letter : 0,
      meeting: copyProgress ? sourceCollab.meeting : null,
      successful: copyStatus ? sourceCollab.successful : null,
      priority: copyPriority ? sourceCollab.priority : "Low",
      amount: copyAmount ? sourceCollab.amount : null,
      contactInFuture: copyContactInFuture
        ? sourceCollab.contactInFuture
        : null,
      type: copyType ? sourceCollab.type : null,
    }));

    // Insert all collaborations
    const createdCollaborations = await db
      .insert(collaborations)
      .values(newCollaborations)
      .returning();

    const skippedCount =
      sourceCollaborations.length - collaborationsToCreate.length;

    return NextResponse.json({
      success: true,
      created: createdCollaborations.length,
      skipped: skippedCount,
      sourceProjectId,
      targetProjectId,
      message:
        skippedCount > 0
          ? `Created ${createdCollaborations.length} collaborations. Skipped ${skippedCount} duplicate companies.`
          : `Successfully created ${createdCollaborations.length} collaborations.`,
      collaborations: createdCollaborations,
    });
  } catch (error) {
    console.error("Error copying collaborations:", error);
    return NextResponse.json(
      { error: "Failed to copy collaborations" },
      { status: 500 }
    );
  }
}
