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
  { params }: { params: { companyId: string } }
) {
  try {
    const companyId = parseInt(params.companyId);

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

    const rows = db.prepare(query).all(companyId) as (PersonDB & {
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
    console.error("Error fetching people by company:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}
