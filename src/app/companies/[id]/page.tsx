"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import { FormDialog } from "@/components/common/form-dialog";
import { CompanyForm } from "@/app/companies/components/form/company-form";
import { CompanyDetailsSection } from "@/app/companies/[id]/components/sections/company-details-section";
import { ContactsSection } from "@/app/companies/[id]/components/sections/contacts-section";
import { CollaborationsSection } from "@/components/collaborations/collaborations-section";
import { DoNotContactWarning } from "@/app/companies/[id]/components/do-not-contact-warning";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { useCompanyDetailOperations } from "@/app/companies/[id]/hooks/use-company-detail-operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Company } from "@/types/company";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const companyId = rawId ? parseInt(rawId) : 0;
  const isMobile = useIsMobile();

  // Custom hooks for operations
  const companyOps = useCompanyDetailOperations(companyId);

  const {
    company,
    isLoadingCompany,
    companyError,
    editDialogOpen,
    setEditDialogOpen,
    handleEditCompany,
    handleDeleteCompany,
    handleSubmitCompany,
  } = companyOps;

  useEffect(() => {
    if (!rawId || isNaN(companyId) || companyId <= 0) {
      toast.error("Invalid company ID");
      router.push("/companies");
      return;
    }
  }, [rawId, companyId, router]);

  // Redirect if company not found
  useEffect(() => {
    if (companyError) {
      toast.error("Failed to load company");
      router.push("/companies");
    }
  }, [companyError, router]);

  const isSubmitting = companyOps.isSubmitting;

  if (isLoadingCompany) {
    return <BlocksWaveLoader size={64} className="my-16" />;
  }

  if (!company) {
    return (
      <div className="mx-auto p-4">
        <div className="text-center py-8 text-muted-foreground">
          Company not found
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/companies")}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {company.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <Button
              onClick={handleEditCompany}
              size={isMobile ? "icon" : "default"}
            >
              <Pencil className="size-4" />
              {!isMobile && "Edit Company"}
            </Button>

            <Button
              onClick={() => handleDeleteCompany(company)}
              size={isMobile ? "icon" : "default"}
            >
              <Trash2 className="size-4" />
              {!isMobile && " Delete Company"}
            </Button>
          </div>
        </div>

        {/* Do Not Contact Warning */}
        {company?.hasDoNotContact && <DoNotContactWarning />}

        <CompanyDetailsSection company={company} />

        {/* Contacts Section */}
        <ContactsSection companyId={companyId} />

        {/* Collaborations Section */}
        <CollaborationsSection type="company" id={companyId} />
      </div>

      <FormDialog<Company>
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        entity="Company"
        initialData={company}
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
