"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ProjectSelect } from "@/components/collaborations/form/project-select";
import {
  CopyCollaborationFormData,
  copyCollaborationSchema,
} from "@/types/collaboration";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { useCollaborationsByProject } from "@/hooks/collaborations/use-collaborations";

interface CopyCollaborationFormProps {
  currentProjectId?: number;
  onSubmit: (data: CopyCollaborationFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CopyCollaborationForm({
  currentProjectId,
  onSubmit,
  isLoading = false,
}: CopyCollaborationFormProps) {
  // Get collaborations for the current project to populate company options
  const { data: collaborations = [] } = useCollaborationsByProject(
    currentProjectId || 0
  );

  // Extract unique companies from collaborations
  const availableCompanies = React.useMemo(() => {
    const companyMap = new Map<number, string>();
    collaborations.forEach((collab) => {
      if (collab.companyId && collab.companyName) {
        companyMap.set(collab.companyId, collab.companyName);
      }
    });
    return Array.from(companyMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [collaborations]);

  const form = useForm<CopyCollaborationFormData>({
    resolver: zodResolver(copyCollaborationSchema),
    defaultValues: {
      projectId: 0,
      companyIds: availableCompanies.map((c) => c.id), // Default to all companies
      copyCompany: true,
      copyContactPerson: true,
      copyType: true,
      copyPriority: true,
      copyContactInFuture: true,
      copyResponsible: false,
      copyComment: false,
      copyProgress: false,
      copyStatus: false,
      copyAmount: false,
    },
  });

  // Update form when available companies change
  React.useEffect(() => {
    if (availableCompanies.length > 0) {
      form.setValue(
        "companyIds",
        availableCompanies.map((c) => c.id)
      );
    }
  }, [availableCompanies, form]);

  const handleSubmit = async (data: CopyCollaborationFormData) => {
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
          <FormItem>
            <FormLabel>Current Project</FormLabel>
            <FormControl>
              <ProjectSelect
                value={currentProjectId}
                onValueChange={() => {}}
                disabled={true}
                className="w-full"
              />
            </FormControl>
            <FormDescription>
              Copy collaborations from this project
            </FormDescription>
          </FormItem>

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Project *</FormLabel>
                <FormControl>
                  <ProjectSelect
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value || 0)}
                    className="w-full"
                    excludeProjectId={currentProjectId}
                  />
                </FormControl>
                <FormDescription>
                  Copy collaborations to this project
                </FormDescription>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="companyIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Companies</FormLabel>
              <FormControl>
                <MultiSelect
                  values={field.value?.map(String) || []}
                  onValuesChange={(values) =>
                    field.onChange(values.map(Number))
                  }
                >
                  <MultiSelectTrigger className="w-full">
                    <MultiSelectValue placeholder="Select companies to copy" />
                  </MultiSelectTrigger>

                  <MultiSelectContent>
                    {availableCompanies.map((company) => (
                      <MultiSelectItem
                        key={company.id}
                        value={company.id.toString()}
                      >
                        {company.name}
                      </MultiSelectItem>
                    ))}
                  </MultiSelectContent>
                </MultiSelect>
              </FormControl>

              <FormDescription>
                Select which fields should be copied from the current
                collaborations for each selected company
              </FormDescription>
            </FormItem>
          )}
        />

        <div className="space-y-4">
          {/* Type and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="copyType"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Collaboration Type
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="copyPriority"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">Priority</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Contact Person and Responsible Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="copyContactPerson"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Contact Person
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="copyResponsible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Responsible Person
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Progress Indicators and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="copyProgress"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Progress Indicators
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="copyStatus"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">Status</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Comment and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="copyComment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">Comment</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="copyAmount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Achieved Value
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Contact in Future */}
          <FormField
            control={form.control}
            name="copyContactInFuture"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">
                    Contact in Future
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
