"use client";

import { useState, useEffect } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyList } from "@/components/companies/company-list";
import { CompanyDialog } from "@/components/companies/company-dialog";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/hooks/useCompanies";
import { Company, CompanyFormData } from "@/types/company";
import { useDebounce } from "@/hooks/useDebounce";

export default function CompaniesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // React Query hooks
  const {
    data: companies = [],
    isLoading: loading,
    error,
  } = useCompanies(debouncedSearchQuery);
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleCreateCompany = () => {
    setEditingCompany(undefined);
    setDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setDialogOpen(true);
  };

  const handleSubmitCompany = async (data: CompanyFormData) => {
    if (editingCompany) {
      // Update existing company
      await updateMutation.mutateAsync({ id: editingCompany.id, data });
    } else {
      // Create new company
      await createMutation.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteCompany = async (companyId: number) => {
    await deleteMutation.mutateAsync(companyId);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Manage your company database
            </p>
          </div>
          <Button onClick={handleCreateCompany}>
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies by name, city, country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading companies...
          </div>
        ) : (
          <>
            {/* Search Results Info */}
            {debouncedSearchQuery.trim() !== "" && (
              <div className="text-sm text-muted-foreground">
                Found {companies.length} companies matching "
                {debouncedSearchQuery}"
              </div>
            )}
            <CompanyList
              companies={companies}
              onEdit={handleEditCompany}
              onDelete={handleDeleteCompany}
            />
          </>
        )}
      </div>

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editingCompany}
        onSubmit={handleSubmitCompany}
        isLoading={isSubmitting}
      />
    </div>
  );
}
