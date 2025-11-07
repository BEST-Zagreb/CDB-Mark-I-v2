import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Contact } from "@/types/contact";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    // Require companyId filter to prevent fetching all contacts
    if (!companyId) {
      return NextResponse.json(
        {
          error: "Filter required: Please provide companyId parameter",
        },
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
      .where(eq(people.companyId, parseInt(companyId)))
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
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const result = await db
      .insert(people)
      .values({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        companyId: data.companyId,
        function: data.function || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    const insertedContact = result[0];

    const contact: Contact = {
      id: insertedContact.id,
      name: insertedContact.name,
      email: insertedContact.email,
      phone: insertedContact.phone,
      companyId: insertedContact.companyId ?? 0,
      function: insertedContact.function,
      createdAt: insertedContact.createdAt
        ? new Date(insertedContact.createdAt)
        : null,
    };

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
