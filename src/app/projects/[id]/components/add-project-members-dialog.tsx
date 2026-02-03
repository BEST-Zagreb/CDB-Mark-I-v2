"use client";

import { useMemo } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";

import { useUsers } from "@/app/users/hooks/use-users";
import { useProjectMembers } from "@/app/projects/[id]/hooks/use-project-members";
import { useAddProjectMembers } from "@/app/projects/[id]/hooks/use-add-project-members";

const schema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one user"),
});

type FormData = z.infer<typeof schema>;

export function AddProjectMembersDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: members = [], isLoading: membersLoading } =
    useProjectMembers(projectId);
  const addMembers = useAddProjectMembers(projectId);

  const existingIds = useMemo(
    () => new Set(members.map((m) => m.appUserId)),
    [members]
  );

  const selectableUsers = useMemo(() => {
    return users
      .filter((u) => !u.isLocked)
      .filter((u) => !existingIds.has(u.id));
  }, [users, existingIds]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userIds: [] },
  });

  const isBusy = usersLoading || membersLoading || addMembers.isPending;

  const onSubmit = async (data: FormData) => {
    await addMembers.mutateAsync(data.userIds);
    form.reset({ userIds: [] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add project members</DialogTitle>
          <DialogDescription>
            Select one or more users to add as project team members.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="add-project-members-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="userIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Members</FormLabel>
                  <FormControl>
                    <MultiSelect
                      values={field.value}
                      onValuesChange={field.onChange}
                    >
                      <MultiSelectTrigger className="w-full justify-between">
                        <MultiSelectValue placeholder="Select users..." />
                      </MultiSelectTrigger>

                      <MultiSelectContent
                        search={{
                          placeholder: "Search users...",
                          emptyMessage: "No users found.",
                        }}
                      >
                        <MultiSelectGroup>
                          {selectableUsers.map((u) => (
                            <MultiSelectItem
                              key={u.id}
                              value={u.id}
                              badgeLabel={u.fullName}
                              disabled={isBusy}
                            >
                              {u.fullName} ({u.email})
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="add-project-members-form"
            disabled={isBusy}
          >
            {isBusy ? "Adding..." : "Add members"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
