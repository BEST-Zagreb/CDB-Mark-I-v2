"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useProjects } from "@/hooks/use-projects";
import { Project } from "@/types/project";

// Form schema for copying collaborations
const copyCollaborationsSchema = z.object({
  targetProjectId: z.number().positive("Target project is required"),
  copyAttributes: z
    .array(z.string())
    .min(1, "At least one attribute must be selected"),
});

type CopyCollaborationsFormData = z.infer<typeof copyCollaborationsSchema>;

interface CopyCollaborationsFormProps {
  currentProjectId: number;
  onSubmit: (data: CopyCollaborationsFormData) => Promise<void>;
  isLoading: boolean;
  open?: boolean;
}

const COPY_ATTRIBUTES = [
  { id: "companyId", label: "Company", required: true, defaultChecked: true },
  { id: "type", label: "Type", required: false, defaultChecked: true },
  { id: "priority", label: "Priority", required: false, defaultChecked: true },
  {
    id: "contactId",
    label: "Contact Person",
    required: false,
    defaultChecked: true,
  },
  {
    id: "responsible",
    label: "Responsible",
    required: false,
    defaultChecked: false,
  },
  { id: "comment", label: "Comment", required: false, defaultChecked: false },
  {
    id: "contactInFuture",
    label: "Contact in future",
    required: false,
    defaultChecked: true,
  },
];

export function CopyCollaborationsForm({
  currentProjectId,
  onSubmit,
  isLoading,
  open = false,
}: CopyCollaborationsFormProps) {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();

  const form = useForm<CopyCollaborationsFormData>({
    resolver: zodResolver(copyCollaborationsSchema),
    defaultValues: {
      targetProjectId: undefined,
      copyAttributes: COPY_ATTRIBUTES.filter((attr) => attr.defaultChecked).map(
        (attr) => attr.id
      ),
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        targetProjectId: undefined,
        copyAttributes: COPY_ATTRIBUTES.filter(
          (attr) => attr.defaultChecked
        ).map((attr) => attr.id),
      });
    }
  }, [open, form]);

  const availableProjects = projects.filter(
    (project) => project.id !== currentProjectId
  );

  // Set default project to newest from available projects (excluding current)
  useEffect(() => {
    if (availableProjects.length > 0 && !form.getValues("targetProjectId")) {
      const sortedAvailableProjects = [...availableProjects].sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
      const newestAvailableProject = sortedAvailableProjects[0];
      form.setValue("targetProjectId", newestAvailableProject.id);
    }
  }, [availableProjects, form]);

  const handleAttributeToggle = (attributeId: string, checked: boolean) => {
    const currentAttributes = form.getValues("copyAttributes");
    if (checked) {
      form.setValue("copyAttributes", [...currentAttributes, attributeId]);
    } else {
      form.setValue(
        "copyAttributes",
        currentAttributes.filter((id) => id !== attributeId)
      );
    }
  };

  return (
    <Form {...form}>
      <form
        id="form-dialog-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="targetProjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Project</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString() || ""}
                disabled={loadingProjects}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target project" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormLabel>Attributes to Copy</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COPY_ATTRIBUTES.map((attribute) => (
              <div key={attribute.id} className="flex items-center space-x-2">
                <Checkbox
                  id={attribute.id}
                  checked={
                    attribute.required ||
                    form.watch("copyAttributes").includes(attribute.id)
                  }
                  disabled={attribute.required}
                  onCheckedChange={(checked) =>
                    handleAttributeToggle(attribute.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={attribute.id}
                  className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                    attribute.required ? "text-muted-foreground" : ""
                  }`}
                >
                  {attribute.label}
                  {attribute.required && " (required)"}
                </label>
              </div>
            ))}
          </div>
          <FormMessage>
            {form.formState.errors.copyAttributes?.message}
          </FormMessage>
        </div>
      </form>
    </Form>
  );
}
