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

import { useProjectMembers } from "@/app/projects/[id]/hooks/use-project-members";
import { useRemoveProjectMembers } from "@/app/projects/[id]/hooks/use-remove-project-members";

const schema = z.object({
  userIds: z.array(z.string()).min(1, "Select at least one member"),
});

type FormData = z.infer<typeof schema>;

export function RemoveProjectMembersDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: members = [], isLoading: membersLoading } =
    useProjectMembers(projectId);
  const removeMembers = useRemoveProjectMembers(projectId);

  const removableMembers = useMemo(() => {
    return members.filter((m) => m.role === "Project team member");
  }, [members]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { userIds: [] },
  });

  const isBusy = membersLoading || removeMembers.isPending;

  const onSubmit = async (data: FormData) => {
    await removeMembers.mutateAsync(data.userIds);
    form.reset({ userIds: [] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Remove project members</DialogTitle>
          <DialogDescription>
            Select one or more project team members to remove from this project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="remove-project-members-form"
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
                        <MultiSelectValue placeholder="Select members..." />
                      </MultiSelectTrigger>

                      <MultiSelectContent
                        search={{
                          placeholder: "Search members...",
                          emptyMessage: "No removable members.",
                        }}
                      >
                        <MultiSelectGroup>
                          {removableMembers.map((m) => (
                            <MultiSelectItem
                              key={m.appUserId}
                              value={m.appUserId}
                              badgeLabel={m.fullName}
                              disabled={isBusy}
                            >
                              {m.fullName} ({m.email})
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
            form="remove-project-members-form"
            variant="destructive"
            disabled={isBusy || removableMembers.length === 0}
          >
            {isBusy ? "Removing..." : "Remove members"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
