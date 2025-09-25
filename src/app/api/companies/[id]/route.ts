import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import {
  updateCompanySchema,
  type CompanyDB,
  type Company,
  dbCompanyToCompany,
} from "@/types/company";

// GET /api/companies/[id] - Get a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        c.*,
        CASE WHEN EXISTS(
          SELECT 1 FROM collaborations 
          WHERE company_id = c.id AND contact_in_future = 0
        ) THEN 1 ELSE 0 END as hasDoNotContact
      FROM companies c WHERE c.id = ?
    `);
    const company: CompanyDB | undefined = stmt.get(companyId) as
      | CompanyDB
      | undefined;

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(dbCompanyToCompany(company));
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Update a specific company
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = updateCompanySchema.parse(body);

    const db = getDatabase();

    // Check if company exists
    const checkStmt = db.prepare("SELECT id FROM companies WHERE id = ?");
    const existingCompany = checkStmt.get(companyId);

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (validatedData.name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(validatedData.name);
    }

    if (validatedData.url !== undefined) {
      updateFields.push("url = ?");
      updateValues.push(validatedData.url || null);
    }

    if (validatedData.address !== undefined) {
      updateFields.push("address = ?");
      updateValues.push(validatedData.address || null);
    }

    if (validatedData.city !== undefined) {
      updateFields.push("city = ?");
      updateValues.push(validatedData.city || null);
    }

    if (validatedData.zip !== undefined) {
      updateFields.push("zip = ?");
      updateValues.push(validatedData.zip || null);
    }

    if (validatedData.country !== undefined) {
      updateFields.push("country = ?");
      updateValues.push(validatedData.country || null);
    }

    if (validatedData.phone !== undefined) {
      updateFields.push("phone = ?");
      updateValues.push(validatedData.phone || null);
    }

    if (validatedData.budgeting_month !== undefined) {
      updateFields.push("budgeting_month = ?");
      updateValues.push(validatedData.budgeting_month || null);
    }

    if (validatedData.comment !== undefined) {
      updateFields.push("comment = ?");
      updateValues.push(validatedData.comment || null);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    updateValues.push(companyId);

    const updateStmt = db.prepare(`
      UPDATE companies 
      SET ${updateFields.join(", ")} 
      WHERE id = ?
    `);

    updateStmt.run(...updateValues);

    // Fetch and return the updated company
    const getStmt = db.prepare(`
      SELECT 
        c.*,
        CASE WHEN EXISTS(
          SELECT 1 FROM collaborations 
          WHERE company_id = c.id AND contact_in_future = 0
        ) THEN 1 ELSE 0 END as hasDoNotContact
      FROM companies c WHERE c.id = ?
    `);
    const updatedCompany: CompanyDB = getStmt.get(companyId) as CompanyDB;

    return NextResponse.json(dbCompanyToCompany(updatedCompany));
  } catch (error) {
    console.error("Error updating company:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid company data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Delete a specific company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "Invalid company ID" },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if company exists before deletion
    const checkStmt = db.prepare("SELECT id FROM companies WHERE id = ?");
    const existingCompany = checkStmt.get(companyId);

    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const deleteStmt = db.prepare("DELETE FROM companies WHERE id = ?");
    const result = deleteStmt.run(companyId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Failed to delete company" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Company deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
