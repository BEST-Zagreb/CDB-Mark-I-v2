"use client";

import { useEffect, useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProjectSelect } from "@/components/collaborations/form/project-select";
import { ResponsiblePersonSelect } from "@/components/collaborations/form/responsible-person-select";
import { MultiCompanySelect } from "@/components/collaborations/form/multi-company-select";
import {
  BulkCollaborationFormData,
  bulkCollaborationSchema,
} from "@/types/collaboration";
import { Separator } from "@/components/ui/separator";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";

interface BulkCollaborationFormProps {
  initialData?: BulkCollaborationFormData | null;
  projectId?: number;
  onSubmit: (data: BulkCollaborationFormData) => Promise<void>;
  isLoading?: boolean;
}

export function BulkCollaborationForm({
  initialData,
  projectId,
  onSubmit,
  isLoading = false,
}: BulkCollaborationFormProps) {
  const form = useForm<BulkCollaborationFormData>({
    resolver: zodResolver(bulkCollaborationSchema),
    defaultValues: {
      companyIds: [],
      projectId: projectId || 0,
      responsible: "",
      comment: "",
      contacted: false,
      letter: false,
      meeting: false,
      successful: null, // Default to "Pending"
      priority: "Low",
      type: null,
      contactInFuture: true,
    },
  });

  // Track if form has been properly initialized with data
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Determine if we should show loading state
  const isFormLoading = isLoading || (initialData && !isFormInitialized);

  // Reset form when data changes
  useEffect(() => {
    setIsFormInitialized(false);

    if (initialData) {
      form.reset({
        companyIds: initialData.companyIds,
        projectId: initialData.projectId,
        contactId: initialData.contactId || undefined,
        responsible: initialData.responsible || "",
        comment: initialData.comment || "",
        contacted: initialData.contacted,
        letter: initialData.letter,
        meeting: initialData.meeting || undefined,
        successful:
          initialData.successful === null
            ? null
            : initialData.successful === true
            ? true
            : false,
        priority: initialData.priority,
        amount: initialData.amount || undefined,
        contactInFuture: initialData.contactInFuture || undefined,
        type: initialData.type as
          | "Financial"
          | "Material"
          | "Educational"
          | null,
      });
    } else {
      form.reset({
        companyIds: [],
        projectId: projectId || 0,
        responsible: "",
        comment: "",
        contacted: false,
        letter: false,
        meeting: false,
        successful: null, // Default to "Pending"
        priority: "Low",
        type: null,
        contactInFuture: true,
      });
      setIsFormInitialized(true);
    }
  }, [initialData, form, projectId]);

  const handleSubmit = async (data: BulkCollaborationFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  // Show loading state while data is being fetched
  if (isFormLoading) {
    return <BlocksWaveLoader size={48} className="my-16" />;
  }

  return (
    <Form {...form}>
      <form
        id="form-dialog-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
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
                  disabled={!!projectId || !!initialData} // Disable if projectId is provided (on project page) or in edit mode
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="companyIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Companies *</FormLabel>
              <FormControl>
                <MultiCompanySelect
                  values={field.value}
                  onValuesChange={field.onChange}
                  placeholder="Select one or multiple companies"
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                Select one or more companies to create collaborations for
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
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "unknown" ? null : value)
                  }
                  value={field.value === null ? "unknown" : field.value}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    <SelectItem value="unknown">
                      Unknown/Not specified
                    </SelectItem>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Material">Material</SelectItem>
                    <SelectItem value="Educational">Educational</SelectItem>
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
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
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
                  placeholder="Search or enter responsible person name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-sm font-medium mb-2">Progress Indicators</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
        </div>

        <FormField
          control={form.control}
          name="successful"
          render={({ field }) => (
            <FormItem className="">
              <FormLabel>Collaboration Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    if (value === "in-progress") {
                      field.onChange(null);
                    } else if (value === "successful") {
                      field.onChange(true);
                    } else if (value === "rejected") {
                      field.onChange(false);
                    }
                  }}
                  value={
                    field.value === null || field.value === undefined
                      ? "in-progress"
                      : field.value === true
                      ? "successful"
                      : "rejected"
                  }
                  disabled={isLoading}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <FormItem className="flex items-center">
                    <FormControl className="cursor-pointer">
                      <RadioGroupItem value="in-progress" />
                    </FormControl>
                    <FormLabel className="font-normal">Pending</FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center">
                    <FormControl className="cursor-pointer">
                      <RadioGroupItem value="successful" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Successful</FormLabel>
                  </FormItem>

                  <FormItem className="flex items-center">
                    <FormControl className="cursor-pointer">
                      <RadioGroupItem value="rejected" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Rejected</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comment</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any comments about these collaborations"
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
                  step={1}
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
                  Mark if these companies should be contacted for future
                  projects
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
