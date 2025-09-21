"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { Company } from "@/types/company";
import { type TablePreferences } from "@/types/table";
import { useRouter } from "next/navigation";
import { TableActions } from "@/components/table-actions";
import { ColumnSelector } from "@/components/ui/column-selector";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  isColumnVisible,
  updateVisibleColumns,
  handleSort,
  getSortIcon,
  visibleColumnsToStrings,
} from "@/lib/table-utils";
import { formatUrl } from "@/lib/format-utils";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import { COMPANY_FIELDS } from "@/config/company-fields";
import { ExternalLink } from "lucide-react";

interface CompanyListProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (companyId: number) => Promise<void>;
}

export function CompanyList({ companies, onEdit, onDelete }: CompanyListProps) {
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  // Default preferences
  const defaultPreferences: TablePreferences<Company> = {
    visibleColumns: ["name", "url", "budgeting_month", "city", "comment"],
    sortField: "name",
    sortDirection: "asc",
  };

  // Consolidated table preferences state with localStorage
  const [tablePreferences, setTablePreferences] =
    useState<TablePreferences<Company>>(defaultPreferences);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = getTablePreferences(
      "companies",
      defaultPreferences
    );
    setTablePreferences(savedPreferences);
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    saveTablePreferences("companies", tablePreferences);
  }, [tablePreferences]);

  function handleUpdateVisibleColumns(newVisibleColumns: string[]) {
    const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
    setTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  }

  function handleSortColumn(field: keyof Company) {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  }

  // Sort companies based on current sort field and direction
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const { sortField, sortDirection } = tablePreferences;

      // For all sortable fields, convert to lowercase for case-insensitive sorting
      aValue = String(a[sortField as keyof Company] || "").toLowerCase();
      bValue = String(b[sortField as keyof Company] || "").toLowerCase();

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [companies, tablePreferences.sortField, tablePreferences.sortDirection]);

  function handleDelete(company: Company) {
    showDeleteAlert({
      entity: "company",
      entityName: company.name,
      onConfirm: () => onDelete(company.id),
    });
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No companies found. Create your first company to get started.
      </div>
    );
  }

  return (
    <>
      <ColumnSelector
        fields={COMPANY_FIELDS.map((field) => ({
          id: field.id,
          label: field.label,
          required: field.required,
        }))}
        visibleColumns={visibleColumnsToStrings(
          tablePreferences.visibleColumns
        )}
        onColumnsChange={handleUpdateVisibleColumns}
        placeholder="Select columns"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {COMPANY_FIELDS.map((column) => {
                if (!isColumnVisible(column.id, tablePreferences)) return null;

                return (
                  <TableHead
                    key={column.id}
                    className={column.center ? "text-center" : ""}
                  >
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSortColumn(column.id)}
                        className="h-auto p-0 font-medium hover:bg-transparent"
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
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCompanies.map((company) => (
              <TableRow key={company.id}>
                {COMPANY_FIELDS.map((column) => {
                  if (
                    !isColumnVisible(column.id, tablePreferences) &&
                    !column.required
                  )
                    return null;

                  if (column.id === "url") {
                    return (
                      <TableCell key={column.id}>
                        {formatUrl(company.url) ? (
                          <a
                            href={formatUrl(company.url)?.link!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                          >
                            <span className="max-w-[200px] truncate">
                              {formatUrl(company.url)?.label}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    );
                  } else if (column.id === "comment") {
                    return (
                      <TableCell key={column.id}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[200px] truncate">
                                {company.comment}
                              </div>
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
                      className={
                        column.center
                          ? "text-center"
                          : "font-medium whitespace-normal"
                      }
                    >
                      {company[column.id] || "—"}
                    </TableCell>
                  );
                })}

                {/* Actions - Always visible */}
                <TableActions
                  item={company}
                  onView={(company) => router.push(`/companies/${company.id}`)}
                  onEdit={onEdit}
                  onDelete={handleDelete}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
