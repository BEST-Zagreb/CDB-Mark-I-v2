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

export async function GET(request: NextRequest) {
  try {
    const db = new Database(dbPath);
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

    const rows = db.prepare(query).all(...params) as (PersonDB & {
      companyName?: string;
    })[];
    db.close();

    const people = rows.map((row) => {
      const person = transformPerson(row);
      if (row.companyName) {
        person.companyName = row.companyName;
      }
      return person;
    });

    return NextResponse.json(people);
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const db = new Database(dbPath);

    const stmt = db.prepare(`
      INSERT INTO people (name, email, phone, company_id, function, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `);

    const result = stmt.run(
      data.name,
      data.email || null,
      data.phone || null,
      data.companyId,
      data.function || null
    );

    const insertedPerson = db
      .prepare("SELECT * FROM people WHERE id = ?")
      .get(result.lastInsertRowid) as PersonDB;

    db.close();

    return NextResponse.json(transformPerson(insertedPerson), { status: 201 });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}
