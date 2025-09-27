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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  projectSchema,
  type ProjectFormData,
  type Project,
} from "@/types/project";

interface ProjectFormProps {
  initialData?: ProjectFormData | null;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ProjectForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialData?.name || "",
      frGoal: initialData?.frGoal || null,
    },
  });

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      await onSubmit(data);
      if (!initialData) {
        // Reset form only for new projects
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter project name"
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
          name="frGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fundraising Goal</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter fundraising goal amount"
                  min={0}
                  step={100}
                  max={1000000}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? parseFloat(value) : null);
                  }}
                  value={field.value || ""}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
