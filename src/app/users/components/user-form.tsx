"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { userSchema, type UserFormData } from "@/types/user";
import { useSession } from "@/lib/auth-client";
import { useIsAdmin } from "@/hooks/use-is-admin";

interface UserFormProps {
  initialData?: UserFormData | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  editingUserId?: string;
}

export function UserForm({
  initialData,
  onSubmit,
  isLoading = false,
  editingUserId,
}: UserFormProps) {
  const { data: session } = useSession();
  const { isAdmin } = useIsAdmin();
  const currentUserId = session?.user?.id;

  // Determine if we should hide the lock checkbox
  // Hide if editing own account OR if the account is an administrator
  const isEditingOwnAccount = editingUserId && editingUserId === currentUserId;
  const isEditingExistingUser = !!editingUserId;

  // Non-admin users editing their own profile can only edit name and description
  const isRestrictedEdit = isEditingOwnAccount && !isAdmin;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      email: initialData?.email || "",
      description: initialData?.description || "",
      isLocked: initialData?.isLocked || false,
      isAdmin: initialData?.isAdmin ?? false,
    },
  });

  const isAdminChecked = form.watch("isAdmin") === true;
  const shouldHideLockField = isEditingOwnAccount || isAdminChecked;

  // Only admins can manage admin role, and not on their own account
  // (also enabled on the create-user form)
  const canManageAdminRole = isAdmin && !isEditingOwnAccount;

  const handleSubmit = async (data: UserFormData) => {
    try {
      // If non-admin editing their own profile, only send allowed fields
      if (isRestrictedEdit) {
        // Only include fullName and description for non-admin self-edit
        const restrictedData: Partial<UserFormData> = {
          fullName: data.fullName,
          description: data.description,
        };
        await onSubmit(restrictedData as UserFormData);
      } else {
        await onSubmit(data);
      }

      if (!initialData) {
        // Reset form only for new users
        form.reset();
      }
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form
        id="form-dialog-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter user's full name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter user email"
                  {...field}
                  disabled={isLoading || !!isRestrictedEdit}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value || ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {canManageAdminRole && (
          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) => {
                      const value = checked === true;
                      field.onChange(value);
                      if (value) {
                        form.setValue("isLocked", false, {
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }
                    }}
                    disabled={isLoading}
                  />
                </FormControl>

                <div>
                  <FormLabel>Administrator</FormLabel>
                  <FormDescription>
                    If checked, this user has administrator permissions.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        {/* Only show lock account checkbox if not editing own account and not admin account */}
        {!shouldHideLockField && (
          <FormField
            control={form.control}
            name="isLocked"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>

                <div>
                  <FormLabel>Lock Account</FormLabel>
                  <FormDescription>
                    If checked, this user will not be able to login.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>
  );
}
