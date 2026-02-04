import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { companies } from "@/db/schema";
import { companySchema, type CompanyFormData } from "@/types/company";
import { getAuthContext, isResponsibleOnAnyProject } from "@/lib/rbac";

const bulkCreateCompaniesSchema = z.object({
  items: z.array(z.unknown()).min(1, "At least one company is required"),
});

type BulkCreateResponse = {
  createdCount: number;
  createdIds: number[];
  skipped: Array<{ index: number; name: string; reason: string }>;
  failed: Array<{ index: number; name: string; error: string }>;
};

const REQUIRED_FIELD_LABELS: Partial<Record<keyof CompanyFormData, string>> = {
  name: "Company Name",
  country: "Country",
};

function toStringField(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function coerceCompanyFormData(item: unknown): CompanyFormData {
  const obj =
    item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    name: toStringField(obj.name),
    url: toStringField(obj.url),
    address: toStringField(obj.address),
    city: toStringField(obj.city),
    zip: toStringField(obj.zip),
    country: toStringField(obj.country),
    phone: toStringField(obj.phone),
    budgeting_month: toStringField(obj.budgeting_month),
    comment: toStringField(obj.comment),
  };
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function cleanCompanyInput(input: CompanyFormData): CompanyFormData {
  return {
    name: input.name.trim(),
    url: input.url.trim(),
    address: input.address.trim(),
    city: input.city.trim(),
    zip: input.zip.trim(),
    country: input.country.trim(),
    phone: input.phone.trim(),
    budgeting_month: input.budgeting_month.trim(),
    comment: input.comment.trim(),
  };
}

// POST /api/companies/bulk - Create multiple companies at once
export async function POST(request: NextRequest) {
  try {
    const authRes = await getAuthContext(request);
    if (!authRes.ok) {
      return NextResponse.json({ error: authRes.error }, { status: authRes.status });
    }

    const { ctx } = authRes;
    const responsibleAny = ctx.isAdmin
      ? true
      : await isResponsibleOnAnyProject(ctx.userId);

    if (!responsibleAny) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const rawBody = await request.json();
    const body = bulkCreateCompaniesSchema.parse(rawBody);

    const failed: BulkCreateResponse["failed"] = [];
    const skipped: BulkCreateResponse["skipped"] = [];

    // 1) Validate each item (with trimming)
    const candidates: Array<{ index: number; data: CompanyFormData }> = [];

    body.items.forEach((item, index) => {
      const cleaned = cleanCompanyInput(coerceCompanyFormData(item));
      const parsed = companySchema.safeParse(cleaned);

      if (!parsed.success) {
        const missingRequired = new Set<keyof CompanyFormData>();

        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (key !== "name" && key !== "country") continue;

          if (issue.code === "too_small" || issue.code === "invalid_type") {
            missingRequired.add(key);
          }
        }

        const missingRequiredLabels = [...missingRequired].map(
          (k) => REQUIRED_FIELD_LABELS[k] ?? k
        );

        const otherMessages = parsed.error.issues
          .filter((issue) => {
            const key = issue.path[0];
            if (key !== "name" && key !== "country") return true;

            return !(
              missingRequired.has(key) &&
              (issue.code === "too_small" || issue.code === "invalid_type")
            );
          })
          .map((issue) => issue.message);

        const uniqueOther = Array.from(new Set(otherMessages));

        let msg = "";
        if (missingRequiredLabels.length > 0) {
          msg = `Missing required fields: ${missingRequiredLabels.join(", ")}`;
        }
        if (uniqueOther.length > 0) {
          msg = msg ? `${msg}. ${uniqueOther.join("; ")}` : uniqueOther.join("; ");
        }
        if (!msg) {
          msg = "Invalid company data";
        }

        failed.push({ index, name: cleaned.name, error: msg });
        return;
      }

      candidates.push({ index, data: parsed.data });
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          createdCount: 0,
          createdIds: [],
          skipped,
          failed,
        } satisfies BulkCreateResponse,
        { status: 200 }
      );
    }

    // 2) Build set of existing normalized names (case-insensitive, trimmed)
    const existingRows = await db
      .select({ name: companies.name })
      .from(companies);

    const existingNormalized = new Set(
      existingRows
        .map((r) => (r.name ?? "").toString())
        .map((n) => normalizeName(n))
        .filter(Boolean)
    );

    // 3) Filter out duplicates (existing + within batch)
    const seenInBatch = new Set<string>();

    const toInsert = candidates.filter(({ index, data }) => {
      const key = normalizeName(data.name);

      if (!key) {
        failed.push({ index, name: data.name, error: "Company name is required" });
        return false;
      }

      if (existingNormalized.has(key)) {
        skipped.push({ index, name: data.name, reason: "Company already exists" });
        return false;
      }

      if (seenInBatch.has(key)) {
        skipped.push({ index, name: data.name, reason: "Duplicate in input" });
        return false;
      }

      seenInBatch.add(key);
      return true;
    });

    const createdIds: number[] = [];

    // 4) Insert rows (best-effort per row)
    await db.transaction(async (tx) => {
      for (const { index, data } of toInsert) {
        try {
          const result = await tx
            .insert(companies)
            .values({
              name: data.name,
              url: data.url || null,
              address: data.address || null,
              city: data.city || null,
              zip: data.zip || null,
              country: data.country || null,
              phone: data.phone || null,
              budgetingMonth: data.budgeting_month || null,
              comment: data.comment || null,
            })
            .returning({ id: companies.id });

          const id = result[0]?.id;
          if (!id) {
            failed.push({ index, name: data.name, error: "Failed to create company" });
            continue;
          }

          createdIds.push(id);
          existingNormalized.add(normalizeName(data.name));
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Failed to create company";
          failed.push({ index, name: data.name, error: msg });
        }
      }
    });

    const response: BulkCreateResponse = {
      createdCount: createdIds.length,
      createdIds,
      skipped,
      failed,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error bulk creating companies:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to bulk create companies" },
      { status: 500 }
    );
  }
}
