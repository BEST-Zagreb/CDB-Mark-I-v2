"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUrl } from "@/lib/format-utils";
import { ExternalLink } from "lucide-react";
import type { Company } from "@/types/company";

interface CompanyDetailsSectionProps {
  company: Company;
}

export function CompanyDetailsSection({ company }: CompanyDetailsSectionProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Company Name
            </label>
            <p className="mt-1 font-medium">{company.name}</p>
          </div>

          {company.url && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Website
              </label>
              <div className="mt-1">
                {formatUrl(company.url) ? (
                  <a
                    href={formatUrl(company.url)?.link!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    {formatUrl(company.url)?.label}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p>{company.url}</p>
                )}
              </div>
            </div>
          )}

          {company.phone && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Phone
              </label>
              <p className="mt-1">{company.phone}</p>
            </div>
          )}

          {company.budgeting_month && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Budgeting Month
              </label>
              <p className="mt-1">
                <Badge variant="outline">
                  {company.budgeting_month || "Unknown"}
                </Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {company.address && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Address
              </label>
              <p className="mt-1">{company.address}</p>
            </div>
          )}

          {company.city && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                City
              </label>
              <p className="mt-1">{company.city}</p>
            </div>
          )}

          {company.zip && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                ZIP Code
              </label>
              <p className="mt-1">{company.zip}</p>
            </div>
          )}

          {company.country && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Country
              </label>
              <p className="mt-1">
                <Badge variant="secondary">{company.country}</Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {company.comment && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{company.comment}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}