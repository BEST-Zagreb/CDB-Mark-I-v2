"use client";

import { CompaniesTable } from "@/components/companies/companies-table";
import { FormDialog } from "@/components/common/form-dialog";
import { CompanyForm } from "@/components/companies/form/company-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { CompaniesPageHeader } from "@/components/companies/companies-page-header";
import { useCompaniesTable } from "@/hooks/use-companies-table";
import { useCompanyOperations } from "@/hooks/use-company-operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Company } from "@/types/company";

export default function CompaniesPage() {
  const isMobile = useIsMobile();

  // Custom hooks for table management and company operations
  const {
    tablePreferences,
    searchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    columnSelectorFields,
    visibleColumnsString,
  } = useCompaniesTable();

  const {
    companies,
    isLoadingCompanies,
    dialogOpen,
    setDialogOpen,
    editingCompany,
    handleCreateCompany,
    handleEditCompany,
    handleSubmitCompany,
    handleDeleteCompany,
    isSubmitting,
  } = useCompanyOperations();

  return (
    <div className="mx-auto p-4">
      <div className="space-y-6">
        <CompaniesPageHeader
          companiesCount={companies.length}
          isMobile={isMobile}
          onCreateCompany={handleCreateCompany}
        />

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

        {isLoadingCompanies ? (
          <BlocksWaveLoader size={96} className="my-16" />
        ) : (
          <CompaniesTable
            companies={companies}
            searchQuery={searchQuery}
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
