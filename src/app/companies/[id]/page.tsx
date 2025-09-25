"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Users,
  Plus,
  Handshake,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { FormDialog } from "@/components/common/form-dialog";
import { CompanyForm } from "@/components/companies/form/company-form";
import { CompanyDetailsSection } from "@/components/companies/sections/company-details-section";
import { ContactsSection } from "@/components/companies/sections/contacts-section";
import { CollaborationsSection } from "@/components/collaborations/collaborations-section";
import { ContactForm } from "@/components/contacts/contacts-form";
import { CollaborationForm } from "@/components/collaborations/form/collaboration-form";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { useCompanyDetailOperations } from "@/hooks/companies/use-company-detail-operations";
import { useContactsOperations } from "@/hooks/contacts/use-contacts-operations";
import { useCollaborationsOperations } from "@/hooks/collaborations/use-collaborations-operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Company } from "@/types/company";
import { Contact } from "@/types/contact";
import { Collaboration } from "@/types/collaboration";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const companyId = rawId ? parseInt(rawId) : 0;
  const isMobile = useIsMobile();

  // Custom hooks for operations
  const companyOps = useCompanyDetailOperations(companyId);
  const contactsOps = useContactsOperations(companyId);
  const collaborationsOps = useCollaborationsOperations("company", companyId);

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

  const {
    contacts,
    isLoadingContacts,
    contactDialogOpen,
    setContactDialogOpen,
    selectedContact,
    handleAddContact,
    handleEditContact,
    handleDeleteContact,
    handleSubmitContact,
  } = contactsOps;

  const {
    collaborations,
    isLoadingCollaborations,
    collaborationDialogOpen,
    setCollaborationDialogOpen,
    editingCollaboration,
    handleAddCollaboration,
    handleEditCollaboration,
    handleDeleteCollaboration,
    handleSubmitCollaboration,
  } = collaborationsOps;

  // Check if company should not be contacted in future
  const hasDoNotContactFlag = collaborations.some(
    (collaboration) => collaboration.contactInFuture === false
  );

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

  const isSubmitting =
    companyOps.isSubmitting ||
    contactsOps.isSubmitting ||
    collaborationsOps.isSubmitting;

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

          <div className="space-x-2 sm:space-x-4">
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
        {hasDoNotContactFlag && (
          <Alert className="border-orange-200 bg-orange-50 text-orange-900 flex items-center gap-4">
            <AlertTriangle className="size-7 shrink-0" />

            <div>
              <AlertTitle>Do Not Contact Warning</AlertTitle>
              <AlertDescription>
                This company has been marked as "do not contact in future" in
                one or more collaborations. Please review collaboration history
                before initiating new contact.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <CompanyDetailsSection company={company} />

        {/* Contacts Section */}
        <ContactsSection
          contacts={contacts}
          isLoadingContacts={isLoadingContacts}
          isMobile={isMobile}
          onAddContact={handleAddContact}
          onEditContact={handleEditContact}
          onDeleteContact={handleDeleteContact}
        />

        {/* Collaborations Section */}
        <CollaborationsSection
          type="company"
          collaborations={collaborations}
          isLoadingCollaborations={isLoadingCollaborations}
          isMobile={isMobile}
          onAddCollaboration={handleAddCollaboration}
          onEditCollaboration={handleEditCollaboration}
          onDeleteCollaboration={handleDeleteCollaboration}
        />
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

      <FormDialog<Contact>
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        entity="Contact"
        initialData={selectedContact}
        onSubmit={handleSubmitContact}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <ContactForm
            initialData={formProps.initialData}
            companyId={companyId}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>

      <FormDialog<Collaboration>
        open={collaborationDialogOpen}
        onOpenChange={setCollaborationDialogOpen}
        entity="Collaboration"
        initialData={editingCollaboration}
        onSubmit={handleSubmitCollaboration}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <CollaborationForm
            initialData={formProps.initialData}
            companyId={companyId}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </div>
  );
}
