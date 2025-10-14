import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Contact } from "@/types/contact";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: companyIdParam } = await params;
    const companyId = parseInt(companyIdParam);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        id: people.id,
        name: people.name,
        email: people.email,
        phone: people.phone,
        companyId: people.companyId,
        function: people.function,
        createdAt: people.createdAt,
        companyName: companies.name,
      })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .where(eq(people.companyId, companyId))
      .orderBy(people.name);

    const contacts: Contact[] = result.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      companyId: row.companyId ?? 0,
      function: row.function,
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
      companyName: row.companyName ?? undefined,
    }));

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts by company:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
