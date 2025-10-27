"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUrl } from "@/lib/format-utils";
import type { Company } from "@/types/company";

interface CompanyDetailsSectionProps {
  company: Company;
}

export function CompanyDetailsSection({ company }: CompanyDetailsSectionProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        {/* Row 1: Website, Phone, Budgeting Month */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {company.url && (
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">
                Website
              </label>
              <div className="mt-1">
                {company.url ? (
                  <div className="truncate">
                    <a
                      href={formatUrl(company.url)?.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-pretty"
                    >
                      {formatUrl(company.url)?.label || "-"}
                    </a>
                  </div>
                ) : (
                  <div className="truncate">-</div>
                )}
              </div>
            </div>
          )}

          {company.phone && (
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">
                Phone
              </label>
              <p className="mt-1 text-sm">{company.phone}</p>
            </div>
          )}

          {company.budgeting_month && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Budgeting Month
              </label>
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {company.budgeting_month || "Unknown"}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Address, City, ZIP, Country */}
        {(company.address ||
          company.city ||
          company.zip ||
          company.country) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {company.address && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Address
                </label>
                <p className="mt-1 text-sm">{company.address}</p>
              </div>
            )}

            {company.city && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  City
                </label>
                <p className="mt-1 text-sm">{company.city}</p>
              </div>
            )}

            {company.zip && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  ZIP Code
                </label>
                <p className="mt-1 text-sm">{company.zip}</p>
              </div>
            )}

            {company.country && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Country
                </label>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {company.country}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Row 3: Comment */}
        {company.comment && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Comment
            </label>
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {company.comment}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
