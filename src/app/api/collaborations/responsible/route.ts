import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collaborations } from "@/db/schema";
import { sql, isNotNull, ne, asc } from "drizzle-orm";

// GET /api/collaborations/responsible - Get all unique responsible persons
export async function GET(request: NextRequest) {
  try {
    // Get all unique responsible persons from collaborations
    const result = await db
      .selectDistinct({ responsible: collaborations.responsible })
      .from(collaborations)
      .where(
        sql`${collaborations.responsible} IS NOT NULL AND ${collaborations.responsible} != ''`
      )
      .orderBy(asc(collaborations.responsible));

    // Extract just the responsible person names
    const responsiblePersons = result
      .map((row) => row.responsible)
      .filter(Boolean);

    return NextResponse.json(responsiblePersons);
  } catch (error) {
    console.error("Error fetching responsible persons:", error);
    return NextResponse.json(
      { error: "Failed to fetch responsible persons" },
      { status: 500 }
    );
  }
}
