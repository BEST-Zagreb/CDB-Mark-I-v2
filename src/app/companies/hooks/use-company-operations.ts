"use client";

import { useState } from "react";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/app/companies/hooks/use-companies";
import { Company, CompanyFormData } from "@/types/company";

export function useCompanyOperations() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();

  // Fetch ALL companies at once (no server-side search filtering)
  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    error,
  } = useCompanies();

  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

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

  return {
    companies,
    isLoadingCompanies,
    error,
    dialogOpen,
    setDialogOpen,
    editingCompany,
    handleCreateCompany,
    handleEditCompany,
    handleSubmitCompany,
    handleDeleteCompany,
    isSubmitting,
  };
}
