import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, collaborations } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { companySchema, type Company } from "@/types/company";

// GET /api/companies - Get all companies
export async function GET(request: NextRequest) {
  try {
    // Get all companies with do not contact status
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
      .orderBy(asc(companies.name));

    const formattedCompanies: Company[] = results.map((company) => ({
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
    }));

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

    // Insert new company
    const result = await db
      .insert(companies)
      .values({
        name: validatedData.name,
        url: validatedData.url || null,
        address: validatedData.address || null,
        city: validatedData.city || null,
        zip: validatedData.zip || null,
        country: validatedData.country || null,
        phone: validatedData.phone || null,
        budgetingMonth: validatedData.budgeting_month || null,
        comment: validatedData.comment || null,
      })
      .returning();

    if (result && result.length > 0) {
      const newCompanyId = result[0].id;

      // Fetch the created company with do not contact status
      const newCompanyData = await db
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
        .where(eq(companies.id, newCompanyId!));

      const company = newCompanyData[0];

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

      return NextResponse.json(formattedCompany, { status: 201 });
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
