"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { TableCell, TableRow } from "@/components/ui/table";
import { TableActions } from "@/components/common/table/table-actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isColumnVisible } from "@/lib/table-utils";
import { formatUrl } from "@/lib/format-utils";
import { COMPANY_FIELDS } from "@/config/company-fields";
import { ShieldAlert } from "lucide-react";
import { Company } from "@/types/company";
import { type TablePreferences } from "@/types/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface CompaniesTableRowProps {
  company: Company;
  tablePreferences: TablePreferences;
  onEdit: (company: Company) => void;
  onDeleteConfirm: (companyId: number) => Promise<void>;
}

export const CompaniesTableRow = memo(function CompanyTableRow({
  company,
  tablePreferences,
  onEdit,
  onDeleteConfirm,
}: CompaniesTableRowProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  // Memoize the view handler to prevent recreation
  const handleView = useCallback(
    (company: Company) => router.push(`/companies/${company.id}`),
    [router]
  );

  // Memoize the delete handler to prevent recreation
  const handleDelete = useCallback(
    (company: Company) => {
      showDeleteAlert({
        entityType: "company",
        entityDescription: `company "${company.name}"`,
        onConfirm: () => onDeleteConfirm(company.id),
      });
    },
    [showDeleteAlert, onDeleteConfirm]
  );

  return (
    <TableRow
      key={company.id}
      className={
        company.hasDoNotContact ? "bg-orange-50 text-muted-foreground" : ""
      }
    >
      {COMPANY_FIELDS.map((column) => {
        if (!isColumnVisible(column.id, tablePreferences) && !column.required)
          return null;

        if (column.id === "name") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${
                column.center ? "text-center" : "font-medium"
              }`}
            >
              <div className="flex items-center gap-2">
                {company.hasDoNotContact && (
                  <ShieldAlert className="size-5 text-orange-900 flex-shrink-0" />
                )}
                <Link
                  href={`/companies/${company.id}`}
                  className="text-primary hover:underline text-pretty"
                >
                  {company.name || "-"}
                </Link>
              </div>
            </TableCell>
          );
        } else if (column.id === "url") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              {formatUrl(company.url) ? (
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
            </TableCell>
          );
        } else if (column.id === "comment") {
          return (
            <TableCell
              key={column.id}
              className={`max-w-50 ${column.center ? "text-center" : ""}`}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="truncate">{company.comment}</div>
                  </TooltipTrigger>

                  <TooltipContent>
                    <p className="max-w-xs font-medium whitespace-pre-wrap p-1">
                      {company.comment}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
          );
        }

        return (
          <TableCell
            key={column.id}
            className={`max-w-50 ${
              column.center ? "text-center" : "font-medium"
            }`}
          >
            <div className="text-pretty">{company[column.id] || "-"}</div>
          </TableCell>
        );
      })}

      {/* Actions - Always visible */}
      <TableActions
        item={company}
        onView={isMobile ? undefined : handleView}
        onEdit={onEdit}
        onDelete={handleDelete}
      />
    </TableRow>
  );
});
