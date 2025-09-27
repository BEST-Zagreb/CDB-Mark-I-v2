import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

// GET /api/collaborations/responsible - Get all unique responsible persons
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();

    // Get all unique responsible persons from collaborations
    const result = await db.execute({
      sql: `
        SELECT DISTINCT responsible 
        FROM collaborations 
        WHERE responsible IS NOT NULL 
          AND responsible != '' 
        ORDER BY responsible ASC
      `,
      args: [],
    });

    const rows = result.rows as unknown as { responsible: string }[];

    // Extract just the responsible person names
    const responsiblePersons = rows.map((row) => row.responsible);

    return NextResponse.json(responsiblePersons);
  } catch (error) {
    console.error("Error fetching responsible persons:", error);
    return NextResponse.json(
      { error: "Failed to fetch responsible persons" },
      { status: 500 }
    );
  }
}
