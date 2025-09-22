"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompaniesTable } from "@/components/companies/companies-table";
import { FormDialog } from "@/components/common/form-dialog";
import { CompanyForm } from "@/components/companies/form/company-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/hooks/use-companies";
import { Company, CompanyFormData } from "@/types/company";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { COMPANY_FIELDS } from "@/config/company-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Default preferences (outside component to prevent recreation)
const defaultPreferences: TablePreferences<Company> = {
  visibleColumns: ["name", "url", "budgeting_month", "city", "comment"],
  sortField: "name",
  sortDirection: "asc",
};

export default function CompaniesPage() {
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  // Table preferences state
  const [tablePreferences, setTablePreferences] = useState<
    TablePreferences<Company>
  >(() => {
    // Initialize with saved preferences on first render
    return getTablePreferences("companies", defaultPreferences);
  });

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    saveTablePreferences("companies", tablePreferences);
  }, [tablePreferences]);

  // Debounce search query for client-side filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch ALL companies at once (no server-side search filtering)
  const { data: companies = [], isLoading: loading, error } = useCompanies(); // No search parameter - fetch all companies

  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  // Memoize column selector handler
  const handleUpdateVisibleColumns = useCallback(
    (newVisibleColumns: string[]) => {
      const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
      setTablePreferences((prev) => ({
        ...prev,
        visibleColumns: visibleColumns,
      }));
    },
    []
  );

  // Handle sorting functionality
  const handleSortColumn = useCallback(
    (field: keyof Company) => {
      const newPreferences = handleSort(tablePreferences, field);
      setTablePreferences(newPreferences);
    },
    [tablePreferences]
  );

  // Memoize column selector fields to prevent recreation
  const columnSelectorFields = useMemo(
    () =>
      COMPANY_FIELDS.map((field) => ({
        id: field.id,
        label: field.label,
        required: field.required,
      })),
    []
  );

  // Memoize visible columns to prevent recreation
  const visibleColumnsString = useMemo(
    () => visibleColumnsToStrings(tablePreferences.visibleColumns),
    [tablePreferences.visibleColumns]
  );

  // Handle search query updates from SearchBar component
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  function handleCreateCompany() {
    setEditingCompany(undefined);
    setDialogOpen(true);
  }

  function handleEditCompany(company: Company) {
    setEditingCompany(company);
    setDialogOpen(true);
  }

  async function handleSubmitCompany(data: CompanyFormData) {
    if (editingCompany) {
      // Update existing company
      await updateMutation.mutateAsync({ id: editingCompany.id, data });
    } else {
      // Create new company
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
  }

  async function handleDeleteCompany(companyId: number) {
    await deleteMutation.mutateAsync(companyId);
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto p-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
              Companies
            </h1>
            <Badge variant="secondary">{companies.length}</Badge>
          </div>
          <Button
            onClick={handleCreateCompany}
            size={isMobile ? "sm" : "default"}
          >
            <Plus className="size-4" />
            New Company
          </Button>
        </div>

        {/* Search Bar and Column Selector */}
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
          <SearchBar
            placeholder="Search companies..."
            onSearchChange={handleSearchChange}
            searchParam="companies_search"
          />

          <ColumnSelector
            fields={columnSelectorFields}
            visibleColumns={visibleColumnsString}
            onColumnsChange={handleUpdateVisibleColumns}
            placeholder="Select columns"
          />
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading companies...
          </div>
        ) : (
          <CompaniesTable
            companies={companies}
            searchQuery={debouncedSearchQuery}
            tablePreferences={tablePreferences}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            onSortColumn={handleSortColumn}
          />
        )}
      </div>

      <FormDialog<Company>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entity="Company"
        initialData={editingCompany}
        onSubmit={handleSubmitCompany}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <CompanyForm
            initialData={formProps.initialData}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </div>
  );
}
