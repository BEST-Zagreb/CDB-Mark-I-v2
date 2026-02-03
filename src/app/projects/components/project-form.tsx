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
  createProjectSchema,
  type ProjectFormData,
} from "@/types/project";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUsers } from "@/app/users/hooks/use-users";




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
  const schema = initialData ? projectSchema : createProjectSchema;
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      frGoal: initialData?.frGoal || null,
      responsibleUserId: "",
    },
  });

  const { data: users = [], isLoading: isLoadingUsers } = useUsers();
  const selectableUsers = users.filter((u) => !u.isLocked);

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
                  step={1}
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

        {!initialData && (
        <FormField
          control={form.control}
          name="responsibleUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Responsible</FormLabel>
              <Select
                value={field.value || ""}
                onValueChange={field.onChange}
                disabled={isLoading || isLoadingUsers}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsible person" />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  {selectableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        )}
      </form>
    </Form>
  );
}
