"use client";

import { ClipboardPaste, Plus } from "lucide-react";
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
import { useCollaborationsTable } from "@/hooks/collaborations/use-collaborations-table";
import { Collaboration } from "@/types/collaboration";

interface ProjectCollaborationsSectionProps {
  collaborations: Collaboration[];
  isLoadingCollaborations: boolean;
  isMobile: boolean;
  onAddCollaboration: () => void;
  onEditCollaboration: (collaboration: Collaboration) => void;
  onDeleteCollaboration: (collaborationId: number) => Promise<void>;
}

export function ProjectCollaborationsSection({
  collaborations,
  isLoadingCollaborations,
  isMobile,
  onAddCollaboration,
  onEditCollaboration,
  onDeleteCollaboration,
}: ProjectCollaborationsSectionProps) {
  const {
    tablePreferences,
    searchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    collaborationFields,
    visibleColumnsString,
  } = useCollaborationsTable("collaborations-projects", ["projectName"]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Collaborations</CardTitle>
              <Badge variant="secondary">{collaborations.length}</Badge>
            </div>
            <CardDescription>
              Companies and organizations involved in this project
            </CardDescription>
          </div>

          <div className="space-x-2 sm:space-x-4">
            <Button
              onClick={onAddCollaboration}
              size={isMobile ? "icon" : "default"}
            >
              <ClipboardPaste className="size-5" />
              {!isMobile && "Copy Collaborations"}
            </Button>

            <Button
              onClick={onAddCollaboration}
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
            onEdit={onEditCollaboration}
            onDelete={onDeleteCollaboration}
            onSortColumn={handleSortColumn}
            hiddenColumns={["projectName"]}
          />
        )}
      </CardContent>
    </Card>
  );
}
