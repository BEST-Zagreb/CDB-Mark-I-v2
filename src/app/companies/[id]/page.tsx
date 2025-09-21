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
import { PeopleList } from "@/components/people/people-list";
import { formatUrl } from "@/lib/format-utils";
import { PersonForm } from "@/components/people/person-form";
import { CollaborationsTable } from "@/components/collaborations/collaborations-table";
import { CollaborationForm } from "@/components/collaborations/collaboration-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import {
  useCompany,
  useDeleteCompany,
  useUpdateCompany,
} from "@/hooks/use-companies";
import {
  usePeopleByCompany,
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
} from "@/hooks/use-people";
import {
  useCollaborationsByCompany,
  useCreateCollaboration,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/use-collaborations";
import { Company, CompanyFormData } from "@/types/company";
import { Person, PersonFormData } from "@/types/person";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";
import { type TablePreferences } from "@/types/table";
import { useDebounce } from "@/hooks/use-debounce";
import { COLLABORATION_FIELDS } from "@/config/collaboration-fields";
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
  const companyId = parseInt(params.id as string);
  const { showDeleteAlert } = useDeleteAlert();
  const isMobile = useIsMobile();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>();
  const [selectedCollaboration, setSelectedCollaboration] = useState<
    Collaboration | undefined
  >();
  const [searchQuery, setSearchQuery] = useState("");

  // Table preferences state for collaborations
  const defaultPreferences: TablePreferences<
    Collaboration & {
      companyName?: string;
      projectName?: string;
      personName?: string;
    }
  > = {
    visibleColumns: [
      "projectName",
      "responsible",
      "priority",
      "personName",
      "comment",
    ],
    sortField: "priority",
    sortDirection: "desc",
  };

  const [tablePreferences, setTablePreferences] = useState(() => {
    return getTablePreferences("collaborations-companies", defaultPreferences);
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // React Query hooks
  const {
    data: company,
    isLoading: loading,
    error: companyError,
  } = useCompany(companyId);
  const { data: people = [], isLoading: peopleLoading } =
    usePeopleByCompany(companyId);
  const { data: collaborations = [], isLoading: collaborationsLoading } =
    useCollaborationsByCompany(companyId);

  // Mutation hooks
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const createPersonMutation = useCreatePerson();
  const updatePersonMutation = useUpdatePerson();
  const deletePersonMutation = useDeletePerson();
  const createCollaborationMutation = useCreateCollaboration();
  const updateCollaborationMutation = useUpdateCollaboration();
  const deleteCollaborationMutation = useDeleteCollaboration();

  // Check if company should not be contacted in future
  const hasDoNotContactFlag = collaborations.some(
    (collaboration) => collaboration.contactInFuture === false
  );

  useEffect(() => {
    if (isNaN(companyId)) {
      toast.error("Invalid company ID");
      router.push("/companies");
      return;
    }
  }, [companyId, router]);

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
      personName?: string;
    })
  ) => {
    const newPreferences = handleSort(tablePreferences, field);
    setTablePreferences(newPreferences);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
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

  const handleAddPerson = () => {
    setSelectedPerson(undefined);
    setPersonDialogOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setPersonDialogOpen(true);
  };

  const handleDeletePerson = async (personId: number) => {
    await deletePersonMutation.mutateAsync(personId);
  };

  const handleSubmitPerson = async (data: PersonFormData) => {
    const personData = { ...data, companyId };

    if (selectedPerson) {
      await updatePersonMutation.mutateAsync({
        id: selectedPerson.id,
        data: personData,
      });
    } else {
      await createPersonMutation.mutateAsync(personData);
    }
    setPersonDialogOpen(false);
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
    createPersonMutation.isPending ||
    updatePersonMutation.isPending ||
    deletePersonMutation.isPending ||
    createCollaborationMutation.isPending ||
    updateCollaborationMutation.isPending ||
    deleteCollaborationMutation.isPending;

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          Loading company...
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          Company not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/companies")}
            >
              <ArrowLeft className="size-6" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {company.name}
            </h1>
          </div>

          <div className="space-x-2 sm:space-x-4">
            <Button onClick={handleEditCompany}>
              <Pencil className="size-4" />
              {!isMobile && "Edit Company"}
            </Button>

            <Button onClick={() => handleDeleteCompany(company)}>
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

        {/* People Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  People
                </CardTitle>
                <CardDescription>
                  People associated with this company
                </CardDescription>
              </div>
              <Button onClick={handleAddPerson}>
                <Plus className="mr-2 h-4 w-4" />
                Add Person
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PeopleList
              people={people}
              onEdit={handleEditPerson}
              onDelete={handleDeletePerson}
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
              <Button onClick={handleAddCollaboration}>
                <Plus className="mr-2 h-4 w-4" />
                Add Collaboration
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar and Column Selector */}
            <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
              <SearchBar
                placeholder="Search collaborations..."
                onSearchChange={handleSearchChange}
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

      <FormDialog<Person>
        open={personDialogOpen}
        onOpenChange={setPersonDialogOpen}
        entity="Person"
        initialData={selectedPerson}
        onSubmit={handleSubmitPerson}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <PersonForm
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
