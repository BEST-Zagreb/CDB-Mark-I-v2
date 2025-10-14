"use client";

import { Plus } from "lucide-react";
import { UsersTable } from "@/app/users/components/table/users-table";
import { FormDialog } from "@/components/common/form-dialog";
import { UserForm } from "@/app/users/components/user-form";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsersTable } from "@/app/users/hooks/use-users-table";
import { useUserOperations } from "@/app/users/hooks/use-user-operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserFormData } from "@/types/user";
import { Suspense } from "react";

export default function UsersPage() {
  const isMobile = useIsMobile();

  // Custom hooks for table management and user operations
  const {
    tablePreferences,
    searchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    columnSelectorFields,
    visibleColumnsString,
  } = useUsersTable();

  const {
    users,
    isLoadingUsers,
    dialogOpen,
    setDialogOpen,
    editingUser,
    handleCreateUser,
    handleEditUser,
    handleSubmitUser,
    handleDeleteUser,
    isSubmitting,
  } = useUserOperations();

  // Transform editingUser to UserFormData for FormDialog
  const initialFormData: UserFormData | undefined = editingUser
    ? {
        name: editingUser.name,
        email: editingUser.email,
      }
    : undefined;

  return (
    <div className="mx-auto p-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
              Users
            </h1>
            <Badge variant="secondary">{users.length}</Badge>
          </div>
          <Button onClick={handleCreateUser} size={isMobile ? "sm" : "default"}>
            <Plus className="size-4" />
            New User
          </Button>
        </div>

        {/* Search Bar and Column Selector */}
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
          <Suspense>
            <SearchBar
              placeholder="Search users..."
              onSearchChange={handleSearchChange}
              searchParam="users_search"
            />
          </Suspense>

          <ColumnSelector
            fields={columnSelectorFields}
            visibleColumns={visibleColumnsString}
            onColumnsChange={handleUpdateVisibleColumns}
            placeholder="Select columns"
          />
        </div>

        {isLoadingUsers ? (
          <BlocksWaveLoader size={96} className="my-16" />
        ) : (
          <UsersTable
            users={users}
            searchQuery={searchQuery}
            tablePreferences={tablePreferences}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onSortColumn={handleSortColumn}
          />
        )}
      </div>

      <FormDialog<UserFormData>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entity="User"
        initialData={initialFormData}
        onSubmit={handleSubmitUser}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <UserForm
            initialData={formProps.initialData}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </div>
  );
}
