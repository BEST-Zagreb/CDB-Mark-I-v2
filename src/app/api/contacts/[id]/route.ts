import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { Contact, ContactDB } from "@/types/contact";

function transformContact(dbContact: ContactDB): Contact {
  return {
    id: dbContact.id,
    name: dbContact.name,
    email: dbContact.email,
    phone: dbContact.phone,
    companyId: dbContact.company_id,
    function: dbContact.function,
    createdAt: dbContact.created_at ? new Date(dbContact.created_at) : null,
  };
}

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

    const db = getDatabase();

    const query = `
      SELECT 
        p.*,
        c.name as companyName
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `;

    const row = db.prepare(query).get(contactId) as
      | (ContactDB & {
          companyName?: string;
        })
      | undefined;

    if (!row) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contact = transformContact(row);
    if (row.companyName) {
      contact.companyName = row.companyName;
    }

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
    const db = getDatabase();

    const stmt = db.prepare(`
      UPDATE people 
      SET name = ?, email = ?, phone = ?, company_id = ?, function = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      data.name,
      data.email || null,
      data.phone || null,
      data.companyId,
      data.function || null,
      contactId
    );

    if (result.changes === 0) {
      db.close();
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updatedContact = db
      .prepare("SELECT * FROM people WHERE id = ?")
      .get(contactId) as ContactDB;

    return NextResponse.json(transformContact(updatedContact));
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

    const db = getDatabase();

    const stmt = db.prepare("DELETE FROM people WHERE id = ?");
    const result = stmt.run(contactId);

    if (result.changes === 0) {
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
