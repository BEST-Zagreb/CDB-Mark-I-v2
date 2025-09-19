"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyList } from "@/components/companies/company-list";
import { CompanyDialog } from "@/components/companies/company-dialog";
import { companyService } from "@/services/company.service";
import { Company, CompanyFormData } from "@/types/company";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Load companies on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
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
    try {
      setSubmitting(true);

      if (editingCompany) {
        // Update existing company
        const updatedCompany = await companyService.update(
          editingCompany.id,
          data
        );
        setCompanies((prev) =>
          prev.map((c) => (c.id === editingCompany.id ? updatedCompany : c))
        );
        toast.success("Company updated successfully");
      } else {
        // Create new company
        const newCompany = await companyService.create(data);
        setCompanies((prev) => [newCompany, ...prev]);
        toast.success("Company created successfully");
      }
    } catch (error) {
      console.error("Error submitting company:", error);
      toast.error(
        editingCompany ? "Failed to update company" : "Failed to create company"
      );
      throw error; // Re-throw to prevent dialog from closing
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async (companyId: number) => {
    try {
      await companyService.delete(companyId);
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
      toast.success("Company deleted successfully");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
      throw error; // Re-throw to prevent optimistic UI update
    }
  };

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

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading companies...
          </div>
        ) : (
          <CompanyList
            companies={companies}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
            isLoading={submitting}
          />
        )}
      </div>

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={editingCompany}
        onSubmit={handleSubmitCompany}
        isLoading={submitting}
      />
    </div>
  );
}
