import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { Person, PersonDB } from "@/types/person";

const dbPath = path.join(process.cwd(), "db", "cdb.sqlite3");

function transformPerson(dbPerson: PersonDB): Person {
  return {
    id: dbPerson.id,
    name: dbPerson.name,
    email: dbPerson.email,
    phone: dbPerson.phone,
    companyId: dbPerson.company_id,
    function: dbPerson.function,
    createdAt: dbPerson.created_at ? new Date(dbPerson.created_at) : null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = parseInt(params.id);

    if (isNaN(personId)) {
      return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
    }

    const db = new Database(dbPath, { readonly: true });

    const query = `
      SELECT 
        p.*,
        c.name as companyName
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `;

    const row = db.prepare(query).get(personId) as
      | (PersonDB & {
          companyName?: string;
        })
      | undefined;
    db.close();

    if (!row) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const person = transformPerson(row);
    if (row.companyName) {
      person.companyName = row.companyName;
    }

    return NextResponse.json(person);
  } catch (error) {
    console.error("Error fetching person:", error);
    return NextResponse.json(
      { error: "Failed to fetch person" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = parseInt(params.id);

    if (isNaN(personId)) {
      return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
    }

    const data = await request.json();
    const db = new Database(dbPath);

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
      personId
    );

    if (result.changes === 0) {
      db.close();
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    const updatedPerson = db
      .prepare("SELECT * FROM people WHERE id = ?")
      .get(personId) as PersonDB;

    db.close();

    return NextResponse.json(transformPerson(updatedPerson));
  } catch (error) {
    console.error("Error updating person:", error);
    return NextResponse.json(
      { error: "Failed to update person" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personId = parseInt(params.id);

    if (isNaN(personId)) {
      return NextResponse.json({ error: "Invalid person ID" }, { status: 400 });
    }

    const db = new Database(dbPath);

    const stmt = db.prepare("DELETE FROM people WHERE id = ?");
    const result = stmt.run(personId);

    db.close();

    if (result.changes === 0) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting person:", error);
    return NextResponse.json(
      { error: "Failed to delete person" },
      { status: 500 }
    );
  }
}
