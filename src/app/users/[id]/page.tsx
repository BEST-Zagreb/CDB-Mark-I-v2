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
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useSession } from "@/lib/auth-client";
import { UserFormData } from "@/types/user";
import { UserDetailsSection } from "@/app/users/[id]/components/sections/user-details-section";
import { CollaborationsSection } from "@/components/collaborations/collaborations-section";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const isMobile = useIsMobile();
  const { isAdmin, isPending: isAdminPending } = useIsAdmin();
  const { data: session } = useSession();

  // Check if current user is viewing their own profile
  const isOwnProfile = session?.user?.id === userId;

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
      (collab) => collab.responsible === user.fullName
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
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        description: user.description,
        isLocked: user.isLocked,
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

            <h1 className="text-3xl font-bold tracking-tight">
              {user.fullName}
            </h1>
          </div>

          {(isAdmin || isOwnProfile) && (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
              <Button
                onClick={handleEditUser}
                size={isMobile ? "icon" : "default"}
              >
                <Pencil className="size-4" />
                {!isMobile &&
                  (isOwnProfile && !isAdmin ? "Edit Profile" : "Edit User")}
              </Button>

              {isAdmin && (
                <Button
                  onClick={() => handleDeleteUser(user)}
                  size={isMobile ? "icon" : "default"}
                >
                  <Trash2 className="size-4" />
                  {!isMobile && " Delete User"}
                </Button>
              )}
            </div>
          )}
        </div>

        <UserDetailsSection user={user} />

        {/* Collaborations Section - showing all collaborations for this user */}
        <CollaborationsSection />
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
            editingUserId={user?.id}
          />
        )}
      </FormDialog>
    </div>
  );
}
