"use client";

import { Handshake, Plus, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CollaborationsTable } from "@/components/collaborations/table/collaborations-table";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { FormDialog } from "@/components/common/form-dialog";
import { CollaborationForm } from "@/components/collaborations/form/collaboration-form";
import { useCollaborationsTable } from "@/hooks/collaborations/use-collaborations-table";
import { useCollaborationsOperations } from "@/hooks/collaborations/use-collaborations-operations";
import {
  useCollaborations,
  useUpdateCollaboration,
  useDeleteCollaboration,
} from "@/hooks/collaborations/use-collaborations";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";
import { useIsMobile } from "@/hooks/use-mobile";
import { Suspense, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/app/users/hooks/use-users";

export function CollaborationsSection() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Extract type and id from pathname
  // Format: /companies/:id, /projects/:id, /users/:id
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageType = pathSegments[0] as "companies" | "projects" | "users";
  const pageId = pathSegments[1] as string;

  // Parse id as number for companies/projects
  const id = pageType !== "users" ? parseInt(pageId) : pageId;

  // Fetch user data if on users page
  const { data: user } = useUser(pageType === "users" ? pageId : "");
  const userName = user?.fullName;

  // For users type, fetch all collaborations and filter client-side
  const { data: allCollabs = [], isLoading: isLoadingAllCollabs } =
    useCollaborations();

  // Only use the operations hook for companies/projects types
  const operationsResult =
    pageType !== "users"
      ? useCollaborationsOperations(
          pageType === "companies" ? "company" : "project",
          id as number
        )
      : null;

  const {
    collaborations: typeCollaborations,
    isLoadingCollaborations: isLoadingType,
    collaborationDialogOpen,
    setCollaborationDialogOpen,
    editingCollaboration,
    handleAddCollaboration,
    handleEditCollaboration,
    handleDeleteCollaboration,
    handleSubmitCollaboration,
    isSubmitting,
  } = operationsResult || {
    collaborations: [],
    isLoadingCollaborations: false,
    collaborationDialogOpen: false,
    setCollaborationDialogOpen: () => {},
    editingCollaboration: undefined,
    handleAddCollaboration: () => {},
    handleEditCollaboration: () => {},
    handleDeleteCollaboration: async () => {},
    handleSubmitCollaboration: async () => {},
    isSubmitting: false,
  };

  // Filter collaborations for users type
  const collaborations = useMemo(() => {
    if (pageType === "users") {
      return allCollabs.filter((collab) => collab.responsible === userName);
    }
    return typeCollaborations;
  }, [pageType, allCollabs, userName, typeCollaborations]);

  const isLoadingCollaborations =
    pageType === "users" ? isLoadingAllCollabs : isLoadingType;

  // For user type, we need separate state and handlers
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userEditingCollab, setUserEditingCollab] = useState<
    Collaboration | undefined
  >();
  const updateCollabMutation = useUpdateCollaboration();
  const deleteCollabMutation = useDeleteCollaboration();

  // User-specific handlers that don't modify companyId/projectId
  const handleUserEditCollaboration = (collaboration: Collaboration) => {
    setUserEditingCollab(collaboration);
    setUserDialogOpen(true);
  };

  const handleUserDeleteCollaboration = async (collaborationId: number) => {
    await deleteCollabMutation.mutateAsync(collaborationId);
  };

  const handleUserSubmitCollaboration = async (data: CollaborationFormData) => {
    if (userEditingCollab) {
      // For user view, preserve the original companyId and projectId
      await updateCollabMutation.mutateAsync({
        id: userEditingCollab.id,
        data: {
          ...data,
          companyId: data.companyId,
          projectId: data.projectId,
        },
      });
    }
    setUserDialogOpen(false);
  };

  const userIsSubmitting =
    updateCollabMutation.isPending || deleteCollabMutation.isPending;

  // Use user-specific handlers for users type
  const finalEditHandler =
    pageType === "users"
      ? handleUserEditCollaboration
      : handleEditCollaboration;
  const finalDeleteHandler =
    pageType === "users"
      ? handleUserDeleteCollaboration
      : handleDeleteCollaboration;
  const finalDialogOpen =
    pageType === "users" ? userDialogOpen : collaborationDialogOpen;
  const finalSetDialogOpen =
    pageType === "users" ? setUserDialogOpen : setCollaborationDialogOpen;
  const finalEditingCollab =
    pageType === "users" ? userEditingCollab : editingCollaboration;
  const finalSubmitHandler =
    pageType === "users"
      ? handleUserSubmitCollaboration
      : handleSubmitCollaboration;
  const finalIsSubmitting =
    pageType === "users" ? userIsSubmitting : isSubmitting;

  const storageKey = (
    pageType === "companies"
      ? "collaborations-companies"
      : "collaborations-projects"
  ) as "collaborations-companies" | "collaborations-projects";
  const hiddenColumns =
    pageType === "companies"
      ? ["companyName"]
      : pageType === "projects"
      ? ["projectName"]
      : [];

  // requiredColumns: columns that must always be visible (can't be deselected)
  // - company page: projectName is required
  // - project page: companyName is required
  // - user page: both are required
  const requiredColumns =
    pageType === "companies"
      ? ["projectName"]
      : pageType === "projects"
      ? ["companyName"]
      : ["projectName", "companyName"];

  const {
    tablePreferences,
    searchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    collaborationFields,
    visibleColumnsString,
  } = useCollaborationsTable(storageKey, hiddenColumns, requiredColumns);

  // Transform editingCollaboration to CollaborationFormData for FormDialog
  const initialFormData: CollaborationFormData | undefined = finalEditingCollab
    ? {
        companyId: finalEditingCollab.companyId,
        projectId: finalEditingCollab.projectId,
        contactId: finalEditingCollab.contactId || undefined,
        responsible: finalEditingCollab.responsible || "",
        comment: finalEditingCollab.comment || "",
        contacted: finalEditingCollab.contacted,
        successful: finalEditingCollab.successful || undefined,
        letter: finalEditingCollab.letter,
        meeting: finalEditingCollab.meeting || undefined,
        priority: finalEditingCollab.priority,
        amount: finalEditingCollab.amount || undefined,
        contactInFuture: finalEditingCollab.contactInFuture || undefined,
        type: finalEditingCollab.type as
          | "Financial"
          | "Material"
          | "Educational"
          | null,
      }
    : undefined;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="flex flex-wrap items-center gap-2">
                {!isMobile && <Handshake className="h-5 w-5" />}
                Collaborations
                <Badge variant="secondary">{collaborations.length}</Badge>
              </CardTitle>

              <CardDescription>
                {pageType === "companies"
                  ? "Collaboration history with this company"
                  : pageType === "projects"
                  ? "Companies to contact regarding this project"
                  : `Collaborations where ${userName} is responsible`}
              </CardDescription>
            </div>

            {pageType !== "users" && (
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
                {pageType === "projects" && (
                  <Button
                    onClick={handleAddCollaboration}
                    size={isMobile ? "icon" : "default"}
                  >
                    <ClipboardPaste className="size-5" />
                    {!isMobile && "Copy Collaborations"}
                  </Button>
                )}

                <Button
                  onClick={handleAddCollaboration}
                  size={isMobile ? "icon" : "default"}
                >
                  <Plus className="size-5" />
                  {!isMobile && "New Collaboration"}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Bar and Column Selector */}
          <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
            <Suspense fallback={<BlocksWaveLoader size={24} />}>
              <SearchBar
                placeholder="Search collaborations..."
                onSearchChange={handleSearchChange}
                searchParam="collaborations_search"
              />
            </Suspense>

            <ColumnSelector
              fields={collaborationFields}
              visibleColumns={visibleColumnsString}
              onColumnsChange={handleUpdateVisibleColumns}
              placeholder="Select columns"
            />
          </div>

          {isLoadingCollaborations ? (
            <BlocksWaveLoader size={48} />
          ) : (
            <CollaborationsTable
              collaborations={collaborations}
              searchQuery={searchQuery}
              tablePreferences={tablePreferences}
              onEdit={finalEditHandler}
              onDelete={finalDeleteHandler}
              onSortColumn={handleSortColumn}
              hiddenColumns={hiddenColumns}
              currentUserName={pageType === "users" ? userName : undefined}
            />
          )}
        </CardContent>
      </Card>

      <FormDialog<CollaborationFormData>
        open={finalDialogOpen}
        onOpenChange={finalSetDialogOpen}
        entity="Collaboration"
        initialData={initialFormData}
        onSubmit={finalSubmitHandler}
        isLoading={finalIsSubmitting}
      >
        {(formProps) => (
          <CollaborationForm
            initialData={formProps.initialData}
            companyId={pageType === "companies" ? (id as number) : undefined}
            projectId={pageType === "projects" ? (id as number) : undefined}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </>
  );
}
