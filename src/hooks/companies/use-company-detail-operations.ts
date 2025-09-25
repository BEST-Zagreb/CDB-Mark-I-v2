"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "@/hooks/companies/use-companies";
import { Company, CompanyFormData } from "@/types/company";
import { useDeleteAlert } from "@/contexts/delete-alert-context";

export function useCompanyDetailOperations(companyId: number) {
  const router = useRouter();
  const { showDeleteAlert } = useDeleteAlert();

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // React Query hooks
  const {
    data: company,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useCompany(companyId);

  // Mutation hooks
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();

  const handleEditCompany = () => {
    setEditDialogOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    showDeleteAlert({
      entity: "company",
      entityName: company.name,
      onConfirm: () => deleteCompanyMutation.mutate(company.id),
    });
  };

  const handleSubmitCompany = async (data: CompanyFormData) => {
    if (!company) return;
    await updateCompanyMutation.mutateAsync({ id: company.id, data });
    setEditDialogOpen(false);
  };

  const isSubmitting = updateCompanyMutation.isPending;

  return {
    company,
    isLoadingCompany,
    companyError,
    editDialogOpen,
    setEditDialogOpen,
    handleEditCompany,
    handleDeleteCompany,
    handleSubmitCompany,
    isSubmitting,
  };
}
