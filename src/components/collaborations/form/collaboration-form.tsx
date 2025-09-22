"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { CompanySelect } from "@/components/collaborations/form/company-select";
import { ProjectSelect } from "@/components/collaborations/form/project-select";
import { ResponsiblePersonSelect } from "@/components/collaborations/form/responsible-person-select";
import { useContactsByCompany } from "@/hooks/use-contacts";
import { useResponsiblePersons } from "@/hooks/use-collaborations";
import {
  Collaboration,
  CollaborationFormData,
  collaborationSchema,
} from "@/types/collaboration";
import { Separator } from "@/components/ui/separator";

// Helper function to ensure priority is a valid string value
function normalizePriority(
  priority: string | number | null | undefined
): "low" | "medium" | "high" {
  if (typeof priority === "string") {
    if (["low", "medium", "high"].includes(priority)) {
      return priority as "low" | "medium" | "high";
    }
  }
  return "low"; // Default fallback
}

interface CollaborationFormProps {
  initialData?: Collaboration | null;
  projectId?: number;
  companyId?: number;
  onSubmit: (data: CollaborationFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CollaborationForm({
  initialData,
  projectId,
  companyId,
  onSubmit,
  isLoading = false,
}: CollaborationFormProps) {
  const form = useForm<CollaborationFormData>({
    resolver: zodResolver(collaborationSchema),
    defaultValues: {
      companyId: companyId || 0,
      projectId: projectId || 0,
      responsible: "",
      comment: "",
      contacted: false,
      letter: false,
      priority: "low",
      type: "financijska",
      contactInFuture: true,
    },
  });

  // Watch the selected company ID to fetch contacts
  const selectedCompanyId = form.watch("companyId");
  const { data: contacts = [] } = useContactsByCompany(selectedCompanyId);

  // Fetch all existing responsible persons for autocomplete
  const { data: responsiblePersons = [] } = useResponsiblePersons();

  // Reset form when collaboration changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        companyId: initialData.companyId,
        projectId: initialData.projectId,
        contactId: initialData.contactId || undefined,
        responsible: initialData.responsible || "",
        comment: initialData.comment || "",
        contacted: initialData.contacted,
        successful: initialData.successful || undefined,
        letter: initialData.letter,
        meeting: initialData.meeting || undefined,
        priority: normalizePriority(initialData.priority),
        amount: initialData.amount || undefined,
        contactInFuture: initialData.contactInFuture || undefined,
        type: initialData.type as "financijska" | "materijalna" | "edukacija",
      });
    } else {
      form.reset({
        companyId: companyId || 0,
        projectId: projectId || 0,
        responsible: "",
        comment: "",
        contacted: false,
        letter: false,
        priority: "low",
        type: "financijska",
        contactInFuture: true,
      });
    }
  }, [initialData, form, projectId, companyId]);

  const handleSubmit = async (data: CollaborationFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Form {...form}>
      <form
        id="form-dialog-form"
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
          name="contactId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Person</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "none" ? undefined : parseInt(value))
                }
                value={field.value?.toString() || "none"}
                disabled={!selectedCompanyId || selectedCompanyId === 0}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedCompanyId || selectedCompanyId === 0
                          ? "Select a company first"
                          : "Select contact person"
                      }
                    />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  <SelectItem value="none">Unknown/Not specified</SelectItem>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>
                      {contact.name}
                      <span className="text-muted-foreground">
                        {contact.function && `(${contact.function})`}
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
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
                <ResponsiblePersonSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={responsiblePersons}
                  placeholder="Search or enter responsible person name"
                  disabled={isLoading}
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
                  {...field}
                  disabled={isLoading}
                  rows={4}
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
                  Mark if this company should be contacted for future projects
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
