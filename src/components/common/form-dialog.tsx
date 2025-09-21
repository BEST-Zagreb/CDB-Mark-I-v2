"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface FormDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: string;
  initialData?: T;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  children: (props: {
    initialData?: T;
    onSubmit: (data: any) => Promise<void>;
    isLoading: boolean;
  }) => ReactNode;
}

export function FormDialog<T = any>({
  open,
  onOpenChange,
  entity,
  initialData,
  onSubmit,
  isLoading = false,
  children,
}: FormDialogProps<T>) {
  const isEditing = !!initialData;

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${entity}` : `Create New ${entity}`}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? `Update the ${entity} information below.`
              : `Fill in the details to create a new ${entity}.`}
          </DialogDescription>
        </DialogHeader>

        {children({
          initialData,
          onSubmit: handleSubmit,
          isLoading,
        })}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button type="submit" disabled={isLoading} form="form-dialog-form">
            {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
