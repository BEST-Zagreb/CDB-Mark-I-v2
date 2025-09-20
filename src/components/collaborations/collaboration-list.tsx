"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collaboration,
  getCollaborationStatusText,
  getCollaborationStatusColor,
  getCollaborationTypeDisplay,
  getPriorityDisplay,
} from "@/types/collaboration";
import {
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  User,
  Calendar,
  DollarSign,
  FolderOpen,
} from "lucide-react";

interface CollaborationListProps {
  collaborations: Collaboration[];
  onEdit: (collaboration: Collaboration) => void;
  onDelete: (collaborationId: number) => Promise<void>;
  isLoading?: boolean;
  showProjectNames?: boolean; // New prop to show project names instead of company names
}

type SortField =
  | "companyName"
  | "projectName"
  | "responsible"
  | "type"
  | "priority"
  | "contacted"
  | "successful"
  | "updatedAt";
type SortDirection = "asc" | "desc";

export function CollaborationList({
  collaborations,
  onEdit,
  onDelete,
  isLoading = false,
  showProjectNames = false,
}: CollaborationListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collaborationToDelete, setCollaborationToDelete] =
    useState<Collaboration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Sort collaborations based on current sort field and direction
  const sortedCollaborations = useMemo(() => {
    return [...collaborations].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "companyName":
          aValue = a.companyName?.toLowerCase() || "";
          bValue = b.companyName?.toLowerCase() || "";
          break;
        case "projectName":
          aValue = a.projectName?.toLowerCase() || "";
          bValue = b.projectName?.toLowerCase() || "";
          break;
        case "responsible":
          aValue = a.responsible?.toLowerCase() || "";
          bValue = b.responsible?.toLowerCase() || "";
          break;
        case "type":
          aValue = a.type?.toLowerCase() || "";
          bValue = b.type?.toLowerCase() || "";
          break;
        case "priority":
          aValue = a.priority;
          bValue = b.priority;
          break;
        case "contacted":
          aValue = a.contacted ? 1 : 0;
          bValue = b.contacted ? 1 : 0;
          break;
        case "successful":
          aValue = a.successful === null ? -1 : a.successful ? 1 : 0;
          bValue = b.successful === null ? -1 : b.successful ? 1 : 0;
          break;
        case "updatedAt":
          aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [collaborations, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const handleDeleteClick = (collaboration: Collaboration) => {
    setCollaborationToDelete(collaboration);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!collaborationToDelete) return;

    setDeleting(true);
    try {
      await onDelete(collaborationToDelete.id);
      setDeleteDialogOpen(false);
      setCollaborationToDelete(null);
    } catch (error) {
      console.error("Error deleting collaboration:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCollaborationToDelete(null);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";

    let dateObj: Date;
    if (typeof date === "string") {
      if (date === "null" || date === "") return "—";
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return "—";

    return new Intl.DateTimeFormat("hr-HR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dateObj);
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "HRK",
    }).format(amount);
  };

  if (collaborations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No collaborations found for this project.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() =>
                    handleSort(showProjectNames ? "projectName" : "companyName")
                  }
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    {showProjectNames ? "Project" : "Company"}
                    {getSortIcon(
                      showProjectNames ? "projectName" : "companyName"
                    )}
                  </span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("type")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    Type
                    {getSortIcon("type")}
                  </span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("responsible")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    Responsible
                    {getSortIcon("responsible")}
                  </span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("priority")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    Priority
                    {getSortIcon("priority")}
                  </span>
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("successful")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    Status
                    {getSortIcon("successful")}
                  </span>
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Amount</TableHead>
              <TableHead className="hidden lg:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("updatedAt")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    Updated
                    {getSortIcon("updatedAt")}
                  </span>
                </Button>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCollaborations.map((collaboration) => (
              <TableRow key={collaboration.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {showProjectNames ? (
                      <>
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <Link
                          href={`/projects/${collaboration.projectId}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {collaboration.projectName || "Unknown Project"}
                        </Link>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Link
                          href={`/companies/${collaboration.companyId}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {collaboration.companyName || "Unknown Company"}
                        </Link>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getCollaborationTypeDisplay(collaboration.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {collaboration.responsible || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      collaboration.priority >= 4
                        ? "destructive"
                        : collaboration.priority >= 3
                        ? "default"
                        : "secondary"
                    }
                  >
                    {getPriorityDisplay(collaboration.priority)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={getCollaborationStatusColor(collaboration)}>
                    {getCollaborationStatusText(collaboration)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-1">
                    {collaboration.amount && (
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                    )}
                    {formatAmount(collaboration.amount)}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(collaboration.updatedAt)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(collaboration)}
                      disabled={isLoading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(collaboration)}
                      disabled={isLoading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collaboration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collaboration with &quot;
              {collaborationToDelete?.companyName}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
