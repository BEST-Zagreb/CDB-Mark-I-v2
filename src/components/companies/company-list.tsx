"use client";

import { useState, useMemo } from "react";
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
import { Pencil, Trash2, ExternalLink, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { TableActions } from "@/components/ui/table-actions";
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
  formatUrl,
  visibleColumnsToStrings,
} from "@/lib/table-utils";

// Define available columns for the table using Company type
const COMPANY_FIELDS: Array<{
  id: keyof Company;
  label: string;
  required: boolean;
  sortable: boolean;
  center: boolean;
}> = [
  { id: "id", label: "ID", required: false, sortable: true, center: true },
  { id: "name", label: "Name", required: true, sortable: true, center: false },
  {
    id: "url",
    label: "Website",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "address",
    label: "Address",
    required: false,
    sortable: true,
    center: false,
  },
  { id: "city", label: "City", required: false, sortable: true, center: false },
  {
    id: "zip",
    label: "ZIP Code",
    required: false,
    sortable: true,
    center: true,
  },
  {
    id: "country",
    label: "Country",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "phone",
    label: "Phone",
    required: false,
    sortable: false,
    center: false,
  },
  {
    id: "budgeting_month",
    label: "Budgeting Month",
    required: false,
    sortable: true,
    center: false,
  },
  {
    id: "comment",
    label: "Comment",
    required: false,
    sortable: true,
    center: false,
  },
];

interface CompanyListProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (companyId: number) => Promise<void>;
}

export function CompanyList({ companies, onEdit, onDelete }: CompanyListProps) {
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  // Consolidated table preferences state
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<Company>
  >({
    visibleColumns: ["name", "url", "city", "country"], // Default visible columns
    sortField: COMPANY_FIELDS[1].id, // Default to second column (name)
    sortDirection: "asc", // Default sort direction
  });

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

  function handleDeleteClick(company: Company) {
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
                          {column.label}
                          {getSortIcon(column.id, tablePreferences)}
                        </span>
                      </Button>
                    ) : (
                      column.label
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
                              <div className="max-w-[150px] truncate cursor-help">
                                {company.comment || "—"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="whitespace-pre-wrap">
                                {company.comment || "No comment"}
                              </div>
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
                  onDelete={handleDeleteClick}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
