import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collaborations, appUsers } from "@/db/schema";
import { sql, asc } from "drizzle-orm";
import { email } from "zod";
import { id } from "zod/v4/locales";

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
      .select({
        id: appUsers.id,
        fullName: appUsers.fullName,
        email: appUsers.email,
      })
      .from(appUsers)
      .orderBy(asc(appUsers.fullName));

    // Create a map of trimmed names to user objects to handle duplicates
    const usersByTrimmedName = new Map(
      users.map((user) => [user.fullName.trim(), user])
    );

    // Process collaboration names, excluding those that match trimmed user names
    const seenTrimmedNames = new Set(Array.from(usersByTrimmedName.keys()));
    const legacyResponsibles = collabResponsible
      .map((row) => row.responsible)
      .filter((name): name is string => Boolean(name)) // Type guard to ensure name is string and not null
      .map((name) => name.trim())
      .filter((name) => {
        if (seenTrimmedNames.has(name)) return false;
        seenTrimmedNames.add(name);
        return true;
      })
      .map((name) => ({
        id: null,
        fullName: name,
        email: null,
      }));

    // Combine users with unique legacy names
    const allResponsiblePersons = [...users, ...legacyResponsibles].sort(
      (a, b) => {
        return a.fullName.trim().localeCompare(b.fullName.trim());
      }
    );

    return NextResponse.json(Array.from(allResponsiblePersons));
  } catch (error) {
    console.error("Error fetching responsible persons:", error);
    return NextResponse.json(
      { error: "Failed to fetch responsible persons" },
      { status: 500 }
    );
  }
}
