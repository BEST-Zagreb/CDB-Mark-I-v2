import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { Contact, ContactDB } from "@/types/contact";

const dbPath = path.join(process.cwd(), "db", "db.sqlite3");

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

    const db = new Database(dbPath);

    const query = `
      SELECT 
        p.*,
        c.name as companyName
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.company_id = ?
      ORDER BY p.name ASC
    `;

    const rows = db.prepare(query).all(companyId) as (ContactDB & {
      companyName?: string;
    })[];
    db.close();

    const contacts = rows.map((row) => {
      const contact = transformContact(row);
      if (row.companyName) {
        contact.companyName = row.companyName;
      }
      return contact;
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts by company:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
