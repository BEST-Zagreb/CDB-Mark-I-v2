import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, collaborations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { updateCompanySchema, type Company } from "@/types/company";

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

    const results = await db
      .select({
        id: companies.id,
        name: companies.name,
        url: companies.url,
        address: companies.address,
        city: companies.city,
        zip: companies.zip,
        country: companies.country,
        phone: companies.phone,
        budgetingMonth: companies.budgetingMonth,
        comment: companies.comment,
        hasDoNotContact: sql<number>`CASE WHEN EXISTS(
          SELECT 1 FROM ${collaborations} 
          WHERE ${collaborations.companyId} = ${companies.id} 
          AND ${collaborations.contactInFuture} = 0
        ) THEN 1 ELSE 0 END`,
      })
      .from(companies)
      .where(eq(companies.id, companyId));

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const company = results[0];
    const formattedCompany: Company = {
      id: company.id!,
      name: company.name || "",
      url: company.url || "",
      address: company.address || "",
      city: company.city || "",
      zip: company.zip || "",
      country: company.country || "",
      phone: company.phone || "",
      budgeting_month: company.budgetingMonth || "",
      comment: company.comment || "",
      hasDoNotContact: company.hasDoNotContact === 1,
    };

    return NextResponse.json(formattedCompany);
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

    // Check if company exists
    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, companyId));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof companies.$inferInsert> = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.url !== undefined) {
      updateData.url = validatedData.url || null;
    }
    if (validatedData.address !== undefined) {
      updateData.address = validatedData.address || null;
    }
    if (validatedData.city !== undefined) {
      updateData.city = validatedData.city || null;
    }
    if (validatedData.zip !== undefined) {
      updateData.zip = validatedData.zip || null;
    }
    if (validatedData.country !== undefined) {
      updateData.country = validatedData.country || null;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone || null;
    }
    if (validatedData.budgeting_month !== undefined) {
      updateData.budgetingMonth = validatedData.budgeting_month || null;
    }
    if (validatedData.comment !== undefined) {
      updateData.comment = validatedData.comment || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update the company
    await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, companyId));

    // Fetch and return the updated company
    const results = await db
      .select({
        id: companies.id,
        name: companies.name,
        url: companies.url,
        address: companies.address,
        city: companies.city,
        zip: companies.zip,
        country: companies.country,
        phone: companies.phone,
        budgetingMonth: companies.budgetingMonth,
        comment: companies.comment,
        hasDoNotContact: sql<number>`CASE WHEN EXISTS(
          SELECT 1 FROM ${collaborations} 
          WHERE ${collaborations.companyId} = ${companies.id} 
          AND ${collaborations.contactInFuture} = 0
        ) THEN 1 ELSE 0 END`,
      })
      .from(companies)
      .where(eq(companies.id, companyId));

    const company = results[0];
    const formattedCompany: Company = {
      id: company.id!,
      name: company.name || "",
      url: company.url || "",
      address: company.address || "",
      city: company.city || "",
      zip: company.zip || "",
      country: company.country || "",
      phone: company.phone || "",
      budgeting_month: company.budgetingMonth || "",
      comment: company.comment || "",
      hasDoNotContact: company.hasDoNotContact === 1,
    };

    return NextResponse.json(formattedCompany);
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

    // Check if company exists before deletion
    const existing = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, companyId));

    if (existing.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Delete the company (cascading deletes will handle related records)
    await db.delete(companies).where(eq(companies.id, companyId));

    return NextResponse.json(
      { message: "Company and all associated data deleted successfully" },
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
