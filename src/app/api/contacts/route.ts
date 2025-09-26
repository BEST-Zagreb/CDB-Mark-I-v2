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

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    let query = `
      SELECT 
        p.*,
        c.name as companyName
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
    `;
    const params: any[] = [];

    if (companyId) {
      query += " WHERE p.company_id = ?";
      params.push(parseInt(companyId));
    }

    query += " ORDER BY p.name ASC";

    const result = await db.execute({
      sql: query,
      args: params,
    });

    const rows = result.rows as (ContactDB & {
      companyName?: string;
    })[];

    const contacts = rows.map((row) => {
      const contact = transformContact(row);
      if (row.companyName) {
        contact.companyName = row.companyName;
      }
      return contact;
    });

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
    const db = await getDatabase();

    const result = await db.execute({
      sql: `
        INSERT INTO people (name, email, phone, company_id, function, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `,
      args: [
        data.name,
        data.email || null,
        data.phone || null,
        data.companyId,
        data.function || null,
      ],
    });

    const getResult = await db.execute({
      sql: "SELECT * FROM people WHERE id = ?",
      args: [result.lastInsertRowid],
    });

    const insertedContact = getResult.rows[0] as ContactDB;

    return NextResponse.json(transformContact(insertedContact), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
