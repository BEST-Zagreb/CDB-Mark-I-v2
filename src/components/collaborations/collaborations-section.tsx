"use client";

import {
  Handshake,
  Plus,
  ClipboardPaste,
  MoreVertical,
  Users,
  Copy,
  Layers,
  Trash2,
  UserRoundPlus,
  Flag,
  Pickaxe,
  ListChecks,
  MessageSquarePlus,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
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
  useBulkDeleteCollaborations,
  useBulkUpdateCollaborations,
} from "@/hooks/collaborations/use-collaborations";
import {
  CollaborationFormData,
  BulkCollaborationFormData,
  CopyCollaborationFormData,
} from "@/types/collaboration";
import { useIsMobile } from "@/hooks/use-mobile";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/app/users/hooks/use-users";
import { useQuery } from "@tanstack/react-query";
import { projectMemberService } from "@/services/project-member.service";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useIsProjectResponsible } from "@/app/projects/[id]/hooks/use-is-project-responsible";
import { useSession } from "@/lib/auth-client";
import { useDeleteAlert } from "@/contexts/delete-alert-context";
import { usePermissions } from "@/hooks/use-permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export function CollaborationsSection() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { showDeleteAlert } = useDeleteAlert();
  const { data: session } = useSession();
  const myUserId = session?.user?.id;

  // Extract type and id from pathname for UI logic
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageType = pathSegments[0] as "companies" | "projects" | "users";
  const pageId = pathSegments[1] as string;
  const id = pageType !== "users" ? parseInt(pageId) : pageId;
  const projectId = pageType === "projects" ? (id as number) : 0;

  const { isAdmin } = useIsAdmin();
  const { isResponsible } = useIsProjectResponsible(projectId);
  const { data: permissions } = usePermissions();
  const responsibleAny = !!permissions?.isResponsibleOnAnyProject;
  const myFullName = permissions?.fullName;

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

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Keep selection in sync with the current list
  useEffect(() => {
    if (pageType !== "projects") {
      setSelectedIds(new Set());
      return;
    }

    const existingIds = new Set(collaborations.map((c) => c.id));
    setSelectedIds((prev) => {
      const next = new Set<number>();
      for (const id of prev) {
        if (existingIds.has(id)) next.add(id);
      }
      return next;
    });
  }, [pageType, collaborations]);

  const selectedCount = selectedIds.size;
  const selectedIdList = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const bulkUpdate = useBulkUpdateCollaborations();
  const bulkDelete = useBulkDeleteCollaborations();

  const { data: projectMembers = [], isLoading: isLoadingProjectMembers } =
    useQuery({
      queryKey: ["projectMembersForBulkActions", projectId],
      queryFn: async () => {
        const res = await projectMemberService.getByProject(projectId);
        return res.items;
      },
      enabled: pageType === "projects" && !!projectId,
      staleTime: 5 * 60 * 1000,
    });

  const myProjectRole = useMemo(() => {
    if (!myUserId) return null;
    const row = projectMembers.find((m) => m.appUserId === myUserId);
    return row?.role ?? null;
  }, [projectMembers, myUserId]);

  const canManageAll = pageType === "projects" && (isAdmin || isResponsible);

  // Per-project rule: if user is a team member on THIS project,
  // allow limited bulk actions regardless of their roles on other projects.
  const isTeamMemberOnThisProject =
    pageType === "projects" && myProjectRole === "Project team member";

  const canBulkDelete = canManageAll;
  const canBulkAssignTo = canManageAll;
  const canBulkPriority = canManageAll;
  const canBulkStatus = canManageAll || isTeamMemberOnThisProject;
  const canBulkProgress = canManageAll || isTeamMemberOnThisProject;
  const canBulkAppendComment = canManageAll || isTeamMemberOnThisProject;

  const canUseBulkActions =
    pageType === "projects" &&
    (canBulkDelete ||
      canBulkAssignTo ||
      canBulkPriority ||
      canBulkStatus ||
      canBulkProgress ||
      canBulkAppendComment);

  const canLogCollaboration =
    isAdmin || (pageType === "projects" ? isResponsible : responsibleAny);
  const canLogMultiple = isAdmin || (pageType === "projects" && isResponsible);
  const canCopyCollaborations = isAdmin || responsibleAny;
  const canEditDeleteCollaboration =
    isAdmin || (pageType === "projects" && isResponsible);

  useEffect(() => {
    if (pageType !== "projects" || canUseBulkActions) return;
    setSelectedIds(new Set());
  }, [pageType, canUseBulkActions]);

  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    contacted: false,
    letter: false,
    meeting: false,
  });

  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [appendComment, setAppendComment] = useState("");

  const runBulkDelete = () => {
    if (pageType !== "projects" || selectedCount === 0) return;

    showDeleteAlert({
      entityType: "collaborations",
      entityDescription: `${selectedCount} collaboration(s)`,
      onConfirm: async () => {
        await bulkDelete.mutateAsync({ projectId, ids: selectedIdList });
        setSelectedIds(new Set());
      },
    });
  };

  const runBulkAssignTo = async (responsible: string) => {
    if (pageType !== "projects" || selectedCount === 0) return;
    await bulkUpdate.mutateAsync({
      projectId,
      ids: selectedIdList,
      set: { responsible },
    });
  };

  const runBulkPriority = async (priority: "Low" | "Medium" | "High") => {
    if (pageType !== "projects" || selectedCount === 0) return;
    await bulkUpdate.mutateAsync({
      projectId,
      ids: selectedIdList,
      set: { priority },
    });
  };

  const runBulkStatus = async (successful: boolean | null) => {
    if (pageType !== "projects" || selectedCount === 0) return;
    await bulkUpdate.mutateAsync({
      projectId,
      ids: selectedIdList,
      set: { successful },
    });
  };

  const runBulkProgress = async () => {
    if (pageType !== "projects" || selectedCount === 0) return;
    await bulkUpdate.mutateAsync({
      projectId,
      ids: selectedIdList,
      set: {
        contacted: bulkProgress.contacted,
        letter: bulkProgress.letter,
        meeting: bulkProgress.meeting,
      },
    });
    setProgressDialogOpen(false);
  };

  const runBulkAppendComment = async () => {
    if (pageType !== "projects" || selectedCount === 0) return;
    if (!appendComment.trim()) return;
    await bulkUpdate.mutateAsync({
      projectId,
      ids: selectedIdList,
      appendComment: appendComment.trim(),
    });
    setAppendComment("");
    setCommentDialogOpen(false);
  };

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
                {pageType === "projects" && canUseBulkActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size={isMobile ? "icon" : "default"}
                        disabled={selectedCount === 0}
                      >
                        <Layers className="size-5" />
                        {!isMobile &&
                          `Bulk actions${
                            selectedCount ? ` (${selectedCount})` : ""
                          }`}
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {selectedCount} selected
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {canBulkDelete && (
                        <DropdownMenuItem
                          onClick={runBulkDelete}
                          className="cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}

                      {canBulkAssignTo && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer">
                            <UserRoundPlus className="mr-2 h-4 w-4" />
                            Assign to
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {isLoadingProjectMembers ? (
                              <DropdownMenuItem disabled>
                                Loading...
                              </DropdownMenuItem>
                            ) : projectMembers.length === 0 ? (
                              <DropdownMenuItem disabled>
                                No project members
                              </DropdownMenuItem>
                            ) : (
                              projectMembers.map((m) => (
                                <DropdownMenuItem
                                  key={`${m.appUserId}-${m.role}`}
                                  onClick={() => runBulkAssignTo(m.fullName)}
                                  className="cursor-pointer"
                                >
                                  {m.fullName}
                                  <DropdownMenuShortcut>
                                    {m.role}
                                  </DropdownMenuShortcut>
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}

                      {canBulkPriority && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer">
                            <Flag className="mr-2 h-4 w-4" />
                            Change priority
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(["Low", "Medium", "High"] as const).map((p) => (
                              <DropdownMenuItem
                                key={p}
                                onClick={() => runBulkPriority(p)}
                                className="cursor-pointer"
                              >
                                {p}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}

                      {canBulkStatus && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer">
                            <Pickaxe className="mr-2 h-4 w-4" />
                            Change status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={() => runBulkStatus(null)}
                              className="cursor-pointer"
                            >
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => runBulkStatus(true)}
                              className="cursor-pointer"
                            >
                              Successful
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => runBulkStatus(false)}
                              className="cursor-pointer"
                            >
                              Rejected
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}

                      {canBulkProgress && (
                        <DropdownMenuItem
                          onClick={() => setProgressDialogOpen(true)}
                          className="cursor-pointer"
                        >
                          <ListChecks className="mr-2 h-4 w-4" />
                          Change progress
                        </DropdownMenuItem>
                      )}

                      {canBulkAppendComment && (
                        <DropdownMenuItem
                          onClick={() => setCommentDialogOpen(true)}
                          className="cursor-pointer"
                        >
                          <MessageSquarePlus className="mr-2 h-4 w-4" />
                          Append comment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {canLogCollaboration && (
                  <Button
                    onClick={handleAddCollaboration}
                    size={isMobile ? "icon" : "default"}
                  >
                    <Plus className="size-5" />
                    {!isMobile && "Log collaboration"}
                  </Button>
                )}

                {pageType === "projects" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size={"icon"}>
                        <MoreVertical className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      {canLogMultiple && (
                        <DropdownMenuItem
                          onClick={handleAddBulkCollaboration}
                          className="cursor-pointer"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Log multiple collaborations
                        </DropdownMenuItem>
                      )}
                      {canCopyCollaborations && (
                        <DropdownMenuItem
                          onClick={handleCopyCollaborations}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy collaborations
                        </DropdownMenuItem>
                      )}
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
              onEdit={canEditDeleteCollaboration ? handleEditCollaboration : undefined}
              onDelete={canEditDeleteCollaboration ? handleDeleteCollaboration : undefined}
              onSortColumn={handleSortColumn}
              hiddenColumns={hiddenColumns}
              currentUserName={
                pageType === "users"
                  ? userName
                  : pageType === "projects" && canManageAll
                  ? undefined
                  : isAdmin
                  ? undefined
                  : myFullName
              }
              enableRowSelection={pageType === "projects" && canUseBulkActions}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk progress dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change progress</DialogTitle>
            <DialogDescription>
              Applies to {selectedCount} selected collaboration(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={bulkProgress.contacted}
                onCheckedChange={(v) =>
                  setBulkProgress((p) => ({ ...p, contacted: v === true }))
                }
              />
              <span>Contacted</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={bulkProgress.letter}
                onCheckedChange={(v) =>
                  setBulkProgress((p) => ({ ...p, letter: v === true }))
                }
              />
              <span>Letter sent</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={bulkProgress.meeting}
                onCheckedChange={(v) =>
                  setBulkProgress((p) => ({ ...p, meeting: v === true }))
                }
              />
              <span>Meeting held</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={runBulkProgress} disabled={bulkUpdate.isPending}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk append comment dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Append comment</DialogTitle>
            <DialogDescription>
              Adds a new line of comment to each selected row.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={appendComment}
            onChange={(e) => setAppendComment(e.target.value)}
            placeholder="Enter comment to append..."
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={runBulkAppendComment}
              disabled={bulkUpdate.isPending || !appendComment.trim()}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
