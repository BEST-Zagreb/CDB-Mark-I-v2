import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import {
  companySchema,
  type CompanyDB,
  type Company,
  dbCompanyToCompany,
} from "@/types/company";

// GET /api/companies - Get all companies with optional search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");

    const db = getDatabase();
    let stmt;
    let companies: CompanyDB[];

    // Get all companies with do not contact status
    stmt = db.prepare(`
        SELECT 
          c.*,
          CASE WHEN EXISTS(
            SELECT 1 FROM collaborations 
            WHERE company_id = c.id AND contact_in_future = 0
          ) THEN 1 ELSE 0 END as hasDoNotContact
        FROM companies c
        ORDER BY name ASC
      `);
    companies = stmt.all() as (CompanyDB & { hasDoNotContact: number })[];

    const formattedCompanies: Company[] = companies.map(dbCompanyToCompany);

    return NextResponse.json(formattedCompanies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = companySchema.parse(body);

    const db = getDatabase();

    const stmt = db.prepare(`
      INSERT INTO companies (name, url, address, city, zip, country, phone, budgeting_month, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      validatedData.name,
      validatedData.url || null,
      validatedData.address || null,
      validatedData.city || null,
      validatedData.zip || null,
      validatedData.country || null,
      validatedData.phone || null,
      validatedData.budgeting_month || null,
      validatedData.comment || null
    );

    if (result.lastInsertRowid) {
      // Fetch the created company with do not contact status
      const getStmt = db.prepare(`
        SELECT 
          c.*,
          CASE WHEN EXISTS(
            SELECT 1 FROM collaborations 
            WHERE company_id = c.id AND contact_in_future = 0
          ) THEN 1 ELSE 0 END as hasDoNotContact
        FROM companies c WHERE c.id = ?
      `);
      const newCompany: CompanyDB = getStmt.get(
        result.lastInsertRowid
      ) as CompanyDB;

      return NextResponse.json(dbCompanyToCompany(newCompany), { status: 201 });
    } else {
      throw new Error("Failed to create company");
    }
  } catch (error) {
    console.error("Error creating company:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid company data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
