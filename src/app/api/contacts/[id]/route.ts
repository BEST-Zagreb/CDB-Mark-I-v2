import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { people, companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Contact } from "@/types/contact";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: "Invalid contact ID" },
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
      .where(eq(people.id, contactId));

    const row = result[0];

    if (!row) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contact: Contact = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      companyId: row.companyId ?? 0,
      function: row.function,
      createdAt: row.createdAt ? new Date(row.createdAt) : null,
      companyName: row.companyName ?? undefined,
    };

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: "Invalid contact ID" },
        { status: 400 }
      );
    }

    const data = await request.json();

    const result = await db
      .update(people)
      .set({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        companyId: data.companyId,
        function: data.function || null,
      })
      .where(eq(people.id, contactId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updatedContact = result[0];

    const contact: Contact = {
      id: updatedContact.id,
      name: updatedContact.name,
      email: updatedContact.email,
      phone: updatedContact.phone,
      companyId: updatedContact.companyId ?? 0,
      function: updatedContact.function,
      createdAt: updatedContact.createdAt
        ? new Date(updatedContact.createdAt)
        : null,
    };

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contactId = parseInt(id);

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: "Invalid contact ID" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(people)
      .where(eq(people.id, contactId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
