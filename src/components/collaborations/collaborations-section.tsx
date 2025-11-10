"use client";

import {
  Handshake,
  Plus,
  ClipboardPaste,
  MoreVertical,
  Users,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CollaborationsTable } from "@/components/collaborations/table/collaborations-table";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { FormDialog } from "@/components/common/form-dialog";
import { CollaborationForm } from "@/components/collaborations/form/collaboration-form";
import { BulkCollaborationForm } from "@/components/collaborations/form/bulk-collaboration-form";
import { CopyCollaborationForm } from "@/components/collaborations/form/copy-collaboration-form";
import { useCollaborationsTable } from "@/hooks/collaborations/use-collaborations-table";
import { useCollaborationsOperations } from "@/hooks/collaborations/use-collaborations-operations";
import {
  CollaborationFormData,
  BulkCollaborationFormData,
  CopyCollaborationFormData,
} from "@/types/collaboration";
import { useIsMobile } from "@/hooks/use-mobile";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/app/users/hooks/use-users";

export function CollaborationsSection() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Extract type and id from pathname for UI logic
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageType = pathSegments[0] as "companies" | "projects" | "users";
  const pageId = pathSegments[1] as string;
  const id = pageType !== "users" ? parseInt(pageId) : pageId;

  // Fetch user data if on users page (for display purposes)
  const { data: user } = useUser(pageType === "users" ? pageId : "");
  const userName = user?.fullName;

  // Use the unified operations hook - it handles everything internally
  const {
    collaborations,
    isLoadingCollaborations,
    collaborationDialogOpen,
    setCollaborationDialogOpen,
    bulkCollaborationDialogOpen,
    setBulkCollaborationDialogOpen,
    copyCollaborationDialogOpen,
    setCopyCollaborationDialogOpen,
    editingCollaboration,
    handleAddCollaboration,
    handleAddBulkCollaboration,
    handleCopyCollaborations,
    handleEditCollaboration,
    handleDeleteCollaboration,
    handleSubmitCollaboration,
    handleSubmitBulkCollaboration,
    handleSubmitCopyCollaboration,
    isSubmitting,
  } = useCollaborationsOperations();

  const storageKey = (
    pageType === "companies"
      ? "collaborations-companies"
      : pageType === "projects"
      ? "collaborations-projects"
      : "collaborations-users"
  ) as
    | "collaborations-companies"
    | "collaborations-projects"
    | "collaborations-users";

  const hiddenColumns =
    pageType === "companies"
      ? ["companyName"]
      : pageType === "projects"
      ? ["projectName"]
      : [];

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
  const initialFormData: CollaborationFormData | undefined =
    editingCollaboration
      ? {
          companyId: editingCollaboration.companyId,
          projectId: editingCollaboration.projectId,
          contactId: editingCollaboration.contactId || undefined,
          responsible: editingCollaboration.responsible || "",
          comment: editingCollaboration.comment || "",
          contacted: editingCollaboration.contacted,
          successful: editingCollaboration.successful || undefined,
          letter: editingCollaboration.letter,
          meeting: editingCollaboration.meeting || undefined,
          priority: editingCollaboration.priority,
          amount: editingCollaboration.amount || undefined,
          contactInFuture: editingCollaboration.contactInFuture || undefined,
          type: editingCollaboration.type as
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
                <Button
                  onClick={handleAddCollaboration}
                  size={isMobile ? "icon" : "default"}
                >
                  <Plus className="size-5" />
                  {!isMobile && "Log collaboration"}
                </Button>

                {pageType === "projects" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size={"icon"}>
                        <MoreVertical className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleAddBulkCollaboration}
                        className="cursor-pointer"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Log multiple collaborations
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleCopyCollaborations}
                        className="cursor-pointer"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy collaborations
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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
              onEdit={handleEditCollaboration}
              onDelete={handleDeleteCollaboration}
              onSortColumn={handleSortColumn}
              hiddenColumns={hiddenColumns}
              currentUserName={pageType === "users" ? userName : undefined}
            />
          )}
        </CardContent>
      </Card>

      <FormDialog<CollaborationFormData>
        open={collaborationDialogOpen}
        onOpenChange={setCollaborationDialogOpen}
        entity="Collaboration"
        initialData={initialFormData}
        onSubmit={handleSubmitCollaboration}
        isLoading={isSubmitting}
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

      <FormDialog<BulkCollaborationFormData>
        open={bulkCollaborationDialogOpen}
        onOpenChange={setBulkCollaborationDialogOpen}
        entity="Bulk Collaborations"
        initialData={undefined}
        onSubmit={handleSubmitBulkCollaboration}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <BulkCollaborationForm
            initialData={formProps.initialData}
            projectId={pageType === "projects" ? (id as number) : undefined}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>

      <FormDialog<CopyCollaborationFormData>
        open={copyCollaborationDialogOpen}
        onOpenChange={setCopyCollaborationDialogOpen}
        entity="Copy Collaborations"
        initialData={undefined}
        onSubmit={handleSubmitCopyCollaboration}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <CopyCollaborationForm
            currentProjectId={
              pageType === "projects" ? (id as number) : undefined
            }
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </>
  );
}
