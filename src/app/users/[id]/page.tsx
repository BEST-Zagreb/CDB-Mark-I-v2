"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/common/form-dialog";
import { UserForm } from "@/app/users/components/user-form";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { useUserDetailOperations } from "@/app/users/[id]/hooks/use-user-detail-operations";
import { useCollaborations } from "@/hooks/collaborations/use-collaborations";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserFormData } from "@/types/user";
import { UserDetailsSection } from "@/app/users/[id]/components/sections/user-details-section";
import { CollaborationsSection } from "@/components/collaborations/collaborations-section";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const isMobile = useIsMobile();

  // Custom hooks for operations
  const userOps = useUserDetailOperations(userId);

  // Fetch all collaborations
  const { data: allCollaborations = [] } = useCollaborations();

  const {
    user,
    isLoadingUser,
    userError,
    editDialogOpen,
    setEditDialogOpen,
    handleEditUser,
    handleDeleteUser,
    handleSubmitUser,
    isSubmitting: isSubmittingUser,
  } = userOps;

  // Filter collaborations where responsible matches user's name
  const userCollaborations = useMemo(() => {
    if (!user) return [];
    return allCollaborations.filter(
      (collab) => collab.responsible === user.name
    );
  }, [allCollaborations, user]);

  useEffect(() => {
    if (!userId) {
      router.push("/users");
      return;
    }
  }, [userId, router]);

  // Redirect if user not found
  useEffect(() => {
    if (userError) {
      router.push("/users");
    }
  }, [userError, router]);

  const isSubmitting = isSubmittingUser;

  // Transform user to UserFormData for FormDialog
  const initialFormData: UserFormData | undefined = user
    ? {
        name: user.name,
        email: user.email,
      }
    : undefined;

  if (isLoadingUser) {
    return <BlocksWaveLoader size={96} className="my-16" />;
  }

  if (!user) {
    return (
      <div className="mx-auto p-4">
        <div className="text-center py-8 text-muted-foreground">
          User not found
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
              onClick={() => router.push("/users")}
            >
              <ArrowLeft className="size-5" />
            </Button>

            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <Button
              onClick={handleEditUser}
              size={isMobile ? "icon" : "default"}
            >
              <Pencil className="size-4" />
              {!isMobile && "Edit User"}
            </Button>

            <Button
              onClick={() => handleDeleteUser(user)}
              size={isMobile ? "icon" : "default"}
            >
              <Trash2 className="size-4" />
              {!isMobile && " Delete User"}
            </Button>
          </div>
        </div>

        <UserDetailsSection user={user} />

        {/* Show collaborations where this user is responsible */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            Collaborations ({userCollaborations.length})
          </h2>
          {userCollaborations.length > 0 ? (
            <div className="space-y-2">
              {userCollaborations.map((collab) => (
                <div
                  key={collab.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        Company ID: {collab.companyId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Project ID: {collab.projectId}
                      </p>
                      {collab.comment && (
                        <p className="text-sm mt-1">{collab.comment}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      {collab.amount && (
                        <p className="font-medium">€{collab.amount}</p>
                      )}
                      {collab.priority && (
                        <p className="text-muted-foreground">
                          {collab.priority}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No collaborations assigned to this user
            </p>
          )}
        </div>
      </div>

      <FormDialog<UserFormData>
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
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
