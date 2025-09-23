"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  Users,
  Handshake,
  Plus,
  AlertTriangle,
  Delete,
  Trash2,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormDialog } from "@/components/common/form-dialog";
import { CompanyForm } from "@/components/companies/form/company-form";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { formatUrl } from "@/lib/format-utils";
import { ContactForm } from "@/components/contacts/contacts-form";
import { CollaborationsTable } from "@/components/collaborations/collaborations-table";
import { CollaborationForm } from "@/components/collaborations/form/collaboration-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import {
  useCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "@/hooks/use-companies";
import {
  useContactsByCompany,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/hooks/use-contacts";
import {
  useCollaborationsByCompany,
  useCreateCollaboration,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/use-collaborations";
import { Company, CompanyFormData } from "@/types/company";
import { Contact, ContactFormData, contactSchema } from "@/types/contact";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
import { CONTACT_FIELDS } from "@/config/contact-fields";
import { getTablePreferences, saveTablePreferences } from "@/lib/local-storage";
import {
  updateVisibleColumns,
  visibleColumnsToStrings,
  handleSort,
} from "@/lib/table-utils";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const companyId = rawId ? parseInt(rawId) : 0;
  const { showDeleteAlert } = useDeleteAlert();
  const isMobile = useIsMobile();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [selectedCollaboration, setSelectedCollaboration] = useState<
    Collaboration | undefined
  >();
  const [searchQuery, setSearchQuery] = useState("");
  const [contactsSearchQuery, setContactsSearchQuery] = useState("");

  // Table preferences state for collaborations
  const defaultPreferences: TablePreferences<
    Collaboration & {
      companyName?: string;
      projectName?: string;
      contactName?: string;
    }
  > = {
    visibleColumns: [
      "projectName",
      "responsible",
      "priority",
      "contactName",
      "comment",
    ],
    sortField: "priority",
    sortDirection: "desc",
  };

  const [tablePreferences, setTablePreferences] = useState(() => {
    return getTablePreferences("collaborations-companies", defaultPreferences);
  });

  // Table preferences state for contacts
  const contactsDefaultPreferences: TablePreferences<Contact> = {
    sortField: "name",
    sortDirection: "asc",
    visibleColumns: ["name", "email", "phone", "function"],
  };

  const [contactsTablePreferences, setContactsTablePreferences] = useState(
    () => {
      return getTablePreferences("contacts", contactsDefaultPreferences);
    }
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedContactsSearchQuery = useDebounce(contactsSearchQuery, 300);

  // React Query hooks
  const {
    data: company,
    isLoading: loading,
    error: companyError,
  } = useCompany(companyId);
  const { data: contacts = [], isLoading: contactsLoading } =
    useContactsByCompany(companyId);
  const { data: collaborations = [], isLoading: collaborationsLoading } =
    useCollaborationsByCompany(companyId);

  // Mutation hooks
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();
  const createCollaborationMutation = useCreateCollaboration();
  const updateCollaborationMutation = useUpdateCollaboration();
  const deleteCollaborationMutation = useDeleteCollaboration();

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

  // Save table preferences to localStorage
  useEffect(() => {
    saveTablePreferences("collaborations-companies", tablePreferences);
  }, [tablePreferences]);

  useEffect(() => {
    saveTablePreferences("contacts", contactsTablePreferences);
  }, [contactsTablePreferences]);

  // Table handler functions
  const handleUpdateVisibleColumns = (newVisibleColumns: string[]) => {
    const visibleColumns = updateVisibleColumns(
      newVisibleColumns,
      "projectName"
    );
    setTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  };

  const handleSortColumn = (
    field: keyof (Collaboration & {
      companyName?: string;
      projectName?: string;
      contactName?: string;
    })
  ) => {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Contacts table handler functions
  const handleContactsUpdateVisibleColumns = (newVisibleColumns: string[]) => {
    const visibleColumns = updateVisibleColumns(newVisibleColumns, "name");
    setContactsTablePreferences((prev) => ({
      ...prev,
      visibleColumns: visibleColumns,
    }));
  };

  const handleContactsSortColumn = (field: keyof Contact) => {
    const newPreferences = handleSort(contactsTablePreferences, field);
    setContactsTablePreferences(newPreferences);
  };

  const handleContactsSearchChange = (query: string) => {
    setContactsSearchQuery(query);
  };

  const handleEditCompany = () => {
    setEditDialogOpen(true);
  };

  function handleDeleteCompany(company: Company) {
    showDeleteAlert({
      entity: "company",
      entityName: company.name,
      onConfirm: () => deleteCompanyMutation.mutate(company.id),
    });
  }

  const handleSubmitCompany = async (data: CompanyFormData) => {
    if (!company) return;
    await updateCompanyMutation.mutateAsync({ id: company.id, data });
    setEditDialogOpen(false);
  };

  const handleAddContact = () => {
    setSelectedContact(undefined);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactDialogOpen(true);
  };

  const handleDeleteContact = async (contactId: number) => {
    await deleteContactMutation.mutateAsync(contactId);
  };

  const handleSubmitContact = async (data: ContactFormData) => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        toast.error("Invalid company ID");
        return;
      }

      const contactData = { ...data, companyId };

      if (selectedContact) {
        await updateContactMutation.mutateAsync({
          id: selectedContact.id,
          data: contactData,
        });
      } else {
        await createContactMutation.mutateAsync(contactData);
      }
      setContactDialogOpen(false);
    } catch (error) {
      console.error("Error in handleSubmitContact:", error);
      // Don't close dialog on error
    }
  };

  const handleAddCollaboration = () => {
    setSelectedCollaboration(undefined);
    setCollaborationDialogOpen(true);
  };

  const handleEditCollaboration = (collaboration: Collaboration) => {
    setSelectedCollaboration(collaboration);
    setCollaborationDialogOpen(true);
  };

  const handleDeleteCollaboration = async (collaborationId: number) => {
    await deleteCollaborationMutation.mutateAsync(collaborationId);
  };

  const handleSubmitCollaboration = async (data: CollaborationFormData) => {
    const collaborationData = {
      ...data,
      companyId: data.companyId || companyId,
    };

    if (selectedCollaboration) {
      await updateCollaborationMutation.mutateAsync({
        id: selectedCollaboration.id,
        data: collaborationData,
      });
    } else {
      await createCollaborationMutation.mutateAsync(collaborationData);
    }
    setCollaborationDialogOpen(false);
  };

  const isSubmitting =
    updateCompanyMutation.isPending ||
    createContactMutation.isPending ||
    updateContactMutation.isPending ||
    deleteContactMutation.isPending ||
    createCollaborationMutation.isPending ||
    updateCollaborationMutation.isPending ||
    deleteCollaborationMutation.isPending;

  if (loading) {
    return (
      <div className="mx-auto p-4">
        <div className="text-center py-8 text-muted-foreground">
          Loading company...
        </div>
      </div>
    );
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Company Name
                </label>
                <p className="mt-1 font-medium">{company.name}</p>
              </div>

              {company.url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Website
                  </label>
                  <div className="mt-1">
                    {formatUrl(company.url) ? (
                      <a
                        href={formatUrl(company.url)?.link!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                      >
                        {formatUrl(company.url)?.label}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <p>{company.url}</p>
                    )}
                  </div>
                </div>
              )}

              {company.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <p className="mt-1">{company.phone}</p>
                </div>
              )}

              {company.budgeting_month && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Budgeting Month
                  </label>
                  <p className="mt-1">
                    <Badge variant="outline">
                      {company.budgeting_month || "Unknown"}
                    </Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Address
                  </label>
                  <p className="mt-1">{company.address}</p>
                </div>
              )}

              {company.city && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <p className="mt-1">{company.city}</p>
                </div>
              )}

              {company.zip && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ZIP Code
                  </label>
                  <p className="mt-1">{company.zip}</p>
                </div>
              )}

              {company.country && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Country
                  </label>
                  <p className="mt-1">
                    <Badge variant="secondary">{company.country}</Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {company.comment && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{company.comment}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contacts Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contacts
                  <Badge variant="secondary">{contacts.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Contacts associated with this company
                </CardDescription>
              </div>

              <Button
                onClick={handleAddContact}
                size={isMobile ? "sm" : "default"}
              >
                <Plus className="size-4" />
                Add Contact
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar and Column Selector */}
            <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
              <SearchBar
                placeholder="Search contacts..."
                onSearchChange={handleContactsSearchChange}
                searchParam="contacts_search"
              />

              <ColumnSelector
                fields={CONTACT_FIELDS.map((field) => ({
                  id: field.id as string,
                  label: field.label,
                  required: field.required,
                }))}
                visibleColumns={visibleColumnsToStrings(
                  contactsTablePreferences.visibleColumns
                )}
                onColumnsChange={handleContactsUpdateVisibleColumns}
                placeholder="Select columns"
              />
            </div>

            <ContactsTable
              contacts={contacts}
              searchQuery={debouncedContactsSearchQuery}
              tablePreferences={contactsTablePreferences}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              onSortColumn={handleContactsSortColumn}
            />
          </CardContent>
        </Card>

        {/* Collaborations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Collaborations
                  <Badge variant="secondary">{collaborations.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Collaboration history with this company
                </CardDescription>
              </div>

              <div className="space-x-2 sm:space-x-4">
                <Button
                  onClick={handleAddCollaboration}
                  size={isMobile ? "icon" : "default"}
                >
                  <Plus className="size-5" />
                  {!isMobile && "New Collaboration"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar and Column Selector */}
            <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
              <SearchBar
                placeholder="Search collaborations..."
                onSearchChange={handleSearchChange}
                searchParam="collaborations_search"
              />

              <ColumnSelector
                fields={COLLABORATION_FIELDS.filter((field) => {
                  // Filter out company name column since we're on a company page
                  if (field.id === "companyName") return false;
                  return true;
                }).map((field) => ({
                  id: field.id as string,
                  label: field.label,
                  required: field.required,
                }))}
                visibleColumns={visibleColumnsToStrings(
                  tablePreferences.visibleColumns
                )}
                onColumnsChange={handleUpdateVisibleColumns}
                placeholder="Select columns"
              />
            </div>

            <CollaborationsTable
              collaborations={collaborations}
              searchQuery={debouncedSearchQuery}
              tablePreferences={tablePreferences}
              onEdit={handleEditCollaboration}
              onDelete={handleDeleteCollaboration}
              onSortColumn={handleSortColumn}
              hiddenColumns={["companyName"]}
            />
          </CardContent>
        </Card>
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
        initialData={selectedCollaboration}
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
