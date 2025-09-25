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
import { Collaboration } from "@/types/collaboration";
import { useIsMobile } from "@/hooks/use-mobile";

interface CollaborationsSectionProps {
  type: "company" | "project";
  id: number;
}

export function CollaborationsSection({
  type,
  id,
}: CollaborationsSectionProps) {
  const isMobile = useIsMobile();

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
    isSubmitting,
  } = useCollaborationsOperations(type, id);

  const storageKey = `collaborations-${
    type === "company" ? "companies" : "projects"
  }` as "collaborations-companies" | "collaborations-projects";
  const hiddenColumn = type === "company" ? "companyName" : "projectName";

  const {
    tablePreferences,
    searchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    collaborationFields,
    visibleColumnsString,
  } = useCollaborationsTable(storageKey, [hiddenColumn]);

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
                {type === "company"
                  ? "Collaboration history with this company"
                  : "Companies to contact regarding this project"}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
              {type === "project" && (
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
              hiddenColumns={[hiddenColumn]}
            />
          )}
        </CardContent>
      </Card>

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
            companyId={type === "company" ? id : undefined}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </>
  );
}
