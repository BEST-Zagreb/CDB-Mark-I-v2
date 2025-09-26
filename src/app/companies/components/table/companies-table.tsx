"use client";

import { useRef, useMemo } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Company } from "@/types/company";
import { type TablePreferences } from "@/types/table";
import { isColumnVisible, getSortIcon } from "@/lib/table-utils";
import { COMPANY_FIELDS } from "@/config/company-fields";
import { CompaniesTableRow } from "@/app/companies/components/table/companies-table-row";
import { useVirtualizedCompanies } from "@/app/companies/hooks/use-virtualized-companies";

interface VirtualizedCompanyListProps {
  companies: Company[];
  searchQuery: string;
  tablePreferences: TablePreferences;
  onEdit: (company: Company) => void;
  onDelete: (companyId: number) => Promise<void>;
  onSortColumn: (field: keyof Company) => void;
}

export function CompaniesTable({
  companies,
  searchQuery,
  tablePreferences,
  onEdit,
  onDelete,
  onSortColumn,
}: VirtualizedCompanyListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort companies based on current sort field and direction
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      let aValue: string | number | boolean | null;
      let bValue: string | number | boolean | null;

      const { sortField, sortDirection } = tablePreferences;

      // Get the raw values (don't convert null to empty string yet)
      aValue = a[sortField as keyof Company];
      bValue = b[sortField as keyof Company];

      // Handle null/undefined/empty string values - they should always sort to the bottom
      const aIsEmpty =
        aValue == null || (typeof aValue === "string" && aValue.trim() === "");
      const bIsEmpty =
        bValue == null || (typeof bValue === "string" && bValue.trim() === "");

      if (aIsEmpty && bIsEmpty) return 0;
      if (aIsEmpty) return 1; // a is empty, b is not - a goes to bottom
      if (bIsEmpty) return -1; // b is empty, a is not - a goes to top

      // For string comparison, convert to lowercase
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Both values are valid, compare normally
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [companies, tablePreferences.sortField, tablePreferences.sortDirection]);

  // Use virtualization hook
  const {
    visibleCompanies,
    rowVirtualizer,
    hasMore,
    totalCount,
    visibleCount,
  } = useVirtualizedCompanies({
    companies: sortedCompanies,
    searchQuery,
    containerRef: containerRef as React.RefObject<HTMLElement>,
  });

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchQuery
          ? `No companies found matching "${searchQuery}"`
          : "No companies found. Create your first company to get started."}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-sm border bg-zinc-50 overflow-hidden"
    >
      <Table>
        <TableHeader className="bg-zinc-100">
          <TableRow>
            {COMPANY_FIELDS.map((column) => {
              if (!isColumnVisible(column.id, tablePreferences)) return null;

              return (
                <TableHead
                  key={column.id}
                  className={`${column.center ? "text-center" : ""}`}
                >
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => onSortColumn(column.id)}
                      className="h-auto p-0 font-bold hover:bg-transparent"
                    >
                      <span className="flex items-center gap-2">
                        {column.icon && (
                          <column.icon className="h-4 w-4 text-muted-foreground" />
                        )}
                        {column.label}
                        {getSortIcon(column.id, tablePreferences)}
                      </span>
                    </Button>
                  ) : (
                    <span className="flex items-center gap-2">
                      {column.icon && (
                        <column.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      {column.label}
                    </span>
                  )}
                </TableHead>
              );
            })}
            {/* Actions - Always visible */}
            <TableHead className="text-center font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>

        {/* Virtualized Table Body */}
        <TableBody>
          {/* Spacer for non-visible items above */}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr
              style={{
                height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px`,
              }}
            >
              <td></td>
            </tr>
          )}

          {/* Render visible items */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const company = visibleCompanies[virtualRow.index];
            if (!company) return null;

            return (
              <CompaniesTableRow
                key={company.id}
                company={company}
                tablePreferences={tablePreferences}
                onEdit={onEdit}
                onDeleteConfirm={onDelete}
              />
            );
          })}

          {/* Spacer for non-visible items below */}
          {rowVirtualizer.getVirtualItems().length > 0 && (
            <tr
              style={{
                height: `${
                  rowVirtualizer.getTotalSize() -
                  (rowVirtualizer.getVirtualItems()[
                    rowVirtualizer.getVirtualItems().length - 1
                  ]?.end || 0)
                }px`,
              }}
            >
              <td></td>
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
