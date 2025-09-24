import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { Collaboration, CollaborationDB } from "@/types/collaboration";

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

// POST /api/collaborations/copy - Copy collaborations from one project to another
export async function POST(request: NextRequest) {
  try {
    const { sourceProjectId, targetProjectId, attributesToCopy } =
      await request.json();

    if (
      !sourceProjectId ||
      !targetProjectId ||
      !attributesToCopy ||
      !Array.isArray(attributesToCopy)
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: sourceProjectId, targetProjectId, attributesToCopy",
        },
        { status: 400 }
      );
    }

    // Company must always be copied
    if (!attributesToCopy.includes("companyId")) {
      return NextResponse.json(
        { error: "Company must always be included in attributes to copy" },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Get all collaborations from source project
    const sourceCollaborations = db
      .prepare("SELECT * FROM collaborations WHERE project_id = ?")
      .all(sourceProjectId) as CollaborationDB[];

    if (sourceCollaborations.length === 0) {
      db.close();
      return NextResponse.json(
        { error: "No collaborations found in source project" },
        { status: 404 }
      );
    }

    // Get companies that already exist in target project
    const existingCompanyIds = db
      .prepare(
        "SELECT DISTINCT company_id FROM collaborations WHERE project_id = ?"
      )
      .all(targetProjectId)
      .map((row: any) => row.company_id) as number[];

    // Filter out collaborations for companies that already exist in target project
    const collaborationsToCopy = sourceCollaborations.filter(
      (collab) => !existingCompanyIds.includes(collab.company_id)
    );

    // Get company names for skipped collaborations
    const skippedCompanies: string[] = [];
    if (existingCompanyIds.length > 0) {
      const skippedCollaborations = sourceCollaborations.filter((collab) =>
        existingCompanyIds.includes(collab.company_id)
      );

      const companyNames = db
        .prepare(
          `SELECT id, name FROM companies WHERE id IN (${skippedCollaborations
            .map(() => "?")
            .join(",")})`
        )
        .all(...skippedCollaborations.map((c) => c.company_id)) as {
        id: number;
        name: string;
      }[];

      skippedCompanies.push(...companyNames.map((c) => c.name));
    }

    const now = new Date().toISOString();
    const copiedCollaborations: Collaboration[] = [];

    // Only proceed if there are collaborations to copy
    if (collaborationsToCopy.length > 0) {
      // Begin transaction
      const transaction = db.transaction(() => {
        for (const sourceCollab of collaborationsToCopy) {
          // Build insert query dynamically based on attributes to copy
          const insertColumns = [
            "company_id",
            "project_id",
            "created_at",
            "updated_at",
          ];
          const insertValues = [
            sourceCollab.company_id,
            targetProjectId,
            now,
            now,
          ];
          const placeholders = ["?", "?", "?", "?"];

          // Map of attribute names to database column names
          const attributeToColumn: Record<string, string> = {
            contactId: "person_id",
            responsible: "responsible",
            comment: "comment",
            contacted: "contacted",
            successful: "successful",
            letter: "letter",
            meeting: "meeting",
            priority: "priority",
            amount: "amount",
            contactInFuture: "contact_in_future",
            type: "type",
          };

          // Add selected attributes to copy
          for (const attribute of attributesToCopy) {
            if (attribute !== "companyId" && attributeToColumn[attribute]) {
              const columnName = attributeToColumn[attribute];
              insertColumns.push(columnName);

              // Get value from source collaboration
              let value = (sourceCollab as any)[columnName];

              // Handle boolean conversion for database storage
              if (typeof value === "boolean") {
                value = value ? 1 : 0;
              }

              insertValues.push(value);
              placeholders.push("?");
            }
          }

          const insertQuery = `
            INSERT INTO collaborations (${insertColumns.join(", ")})
            VALUES (${placeholders.join(", ")})
          `;

          const result = db.prepare(insertQuery).run(...insertValues);

          // Get the created collaboration with related data
          const getQuery = `
            SELECT c.*, companies.name as companyName, people.name as contactName, projects.name as projectName
            FROM collaborations c
            LEFT JOIN companies ON c.company_id = companies.id
            LEFT JOIN people ON c.person_id = people.id
            LEFT JOIN projects ON c.project_id = projects.id
            WHERE c.id = ?
          `;

          const newRow = db
            .prepare(getQuery)
            .get(result.lastInsertRowid) as CollaborationDB & {
            companyName?: string;
            contactName?: string;
            projectName?: string;
          };

          const collaboration = transformCollaboration(newRow);
          collaboration.companyName = newRow.companyName || undefined;
          collaboration.contactName = newRow.contactName || undefined;
          collaboration.projectName = newRow.projectName || undefined;

          copiedCollaborations.push(collaboration);
        }
      });

      // Execute transaction
      transaction();
    }

    db.close();

    return NextResponse.json(
      {
        copiedCollaborations,
        skippedCompanies,
        totalAttempted: sourceCollaborations.length,
        totalCopied: copiedCollaborations.length,
        totalSkipped: skippedCompanies.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error copying collaborations:", error);
    return NextResponse.json(
      { error: "Failed to copy collaborations" },
      { status: 500 }
    );
  }
}
