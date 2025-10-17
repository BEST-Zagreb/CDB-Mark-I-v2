import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collaborations, appUsers } from "@/db/schema";
import { sql, asc } from "drizzle-orm";

// GET /api/collaborations/responsible - Get all unique responsible persons
export async function GET(request: NextRequest) {
  try {
    // Get all unique responsible persons from collaborations
    const collabResponsible = await db
      .selectDistinct({ responsible: collaborations.responsible })
      .from(collaborations)
      .where(
        sql`${collaborations.responsible} IS NOT NULL AND ${collaborations.responsible} != ''`
      )
      .orderBy(asc(collaborations.responsible));

    // Get all users from database
    const users = await db
      .select({ fullName: appUsers.fullName })
      .from(appUsers)
      .orderBy(asc(appUsers.fullName));

    // Extract responsible person names from collaborations
    const collabResponsibleNames = collabResponsible
      .map((row) => row.responsible)
      .filter(Boolean) as string[];

    // Extract user full names
    const userFullNames = users
      .map((row) => row.fullName)
      .filter(Boolean) as string[];

    // Combine and get unique values (users take priority)
    const allResponsiblePersons = Array.from(
      new Set([...userFullNames, ...collabResponsibleNames])
    ).sort();

    return NextResponse.json(allResponsiblePersons);
  } catch (error) {
    console.error("Error fetching responsible persons:", error);
    return NextResponse.json(
      { error: "Failed to fetch responsible persons" },
      { status: 500 }
    );
  }
}
