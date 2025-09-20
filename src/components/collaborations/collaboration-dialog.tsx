"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CompanySelect } from "@/components/collaborations/company-select";
import { ProjectSelect } from "@/components/collaborations/project-select";
import { usePeopleByCompany } from "@/hooks/usePeople";
import {
  Collaboration,
  CollaborationFormData,
  collaborationSchema,
} from "@/types/collaboration";
import { Separator } from "@/components/ui/separator";

interface CollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaboration?: Collaboration | null;
  projectId?: number; // Made optional
  companyId?: number; // Added for company page
  onSubmit: (data: CollaborationFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CollaborationDialog({
  open,
  onOpenChange,
  collaboration,
  projectId,
  companyId,
  onSubmit,
  isLoading = false,
}: CollaborationDialogProps) {
  const form = useForm<CollaborationFormData>({
    resolver: zodResolver(collaborationSchema),
    defaultValues: {
      companyId: companyId || 0,
      projectId: projectId || 0,
      responsible: "",
      comment: "",
      contacted: false,
      letter: false,
      priority: 2,
      type: "financijska",
      contactInFuture: true,
    },
  });

  // Watch the selected company ID to fetch people
  const selectedCompanyId = form.watch("companyId");
  const { data: people = [] } = usePeopleByCompany(selectedCompanyId);

  // Reset form when collaboration changes
  useEffect(() => {
    if (open) {
      if (collaboration) {
        form.reset({
          companyId: collaboration.companyId,
          projectId: collaboration.projectId,
          personId: collaboration.personId || undefined,
          responsible: collaboration.responsible || "",
          comment: collaboration.comment || "",
          contacted: collaboration.contacted,
          successful: collaboration.successful || undefined,
          letter: collaboration.letter,
          meeting: collaboration.meeting || undefined,
          priority: collaboration.priority,
          amount: collaboration.amount || undefined,
          contactInFuture: collaboration.contactInFuture || undefined,
          type: collaboration.type as
            | "financijska"
            | "materijalna"
            | "edukacija",
        });
      } else {
        form.reset({
          companyId: companyId || 0,
          projectId: projectId || 0,
          responsible: "",
          comment: "",
          contacted: false,
          letter: false,
          priority: 2,
          type: "financijska",
          contactInFuture: true,
        });
      }
    }
  }, [collaboration, form, open, projectId, companyId]);

  const handleSubmit = async (data: CollaborationFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const isEditing = !!collaboration;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Collaboration" : "New Collaboration"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the collaboration details."
              : "Add a new collaboration to this project."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <CompanySelect
                        value={field.value || undefined}
                        onValueChange={(value) => field.onChange(value || 0)}
                        disabled={!!companyId} // Disable if companyId is provided (on company page)
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project *</FormLabel>
                    <FormControl>
                      <ProjectSelect
                        value={field.value || undefined}
                        onValueChange={(value) => field.onChange(value || 0)}
                        disabled={!!projectId} // Disable if projectId is provided (on project page)
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(
                        value === "none" ? undefined : parseInt(value)
                      )
                    }
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl className="w-full">
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact person" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      <SelectItem value="none">
                        Unknown/Not specified
                      </SelectItem>
                      {people.map((person) => (
                        <SelectItem
                          key={person.id}
                          value={person.id.toString()}
                        >
                          {person.name}
                          <span className="text-muted-foreground">
                            {person.function && `(${person.function})`}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Contact person from the selected company (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Collaboration type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="financijska">Financial</SelectItem>
                        <SelectItem value="materijalna">Material</SelectItem>
                        <SelectItem value="edukacija">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select
                      onValueChange={(value: string) =>
                        field.onChange(parseInt(value))
                      }
                      value={field.value?.toString()}
                    >
                      <FormControl className="w-full">
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="1">Very Low</SelectItem>
                        <SelectItem value="2">Low</SelectItem>
                        <SelectItem value="3">Medium</SelectItem>
                        <SelectItem value="4">High</SelectItem>
                        <SelectItem value="5">Very High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="responsible"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsible Person *</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Enter responsible person name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-sm font-medium mb-2">Status</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <FormField
                control={form.control}
                name="contacted"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Contacted</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="letter"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Letter Sent</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meeting"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Meeting Held</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="successful"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Successful</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any comments about this collaboration"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achieved value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      step={50}
                      min={0}
                      max={1000000}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                      value={field.value || ""}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <FormField
              control={form.control}
              name="contactInFuture"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Contact in Future</FormLabel>
                    <FormDescription>
                      Mark if this company should be contacted for future
                      projects
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
