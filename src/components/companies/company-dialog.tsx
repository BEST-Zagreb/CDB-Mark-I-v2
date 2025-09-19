"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyForm } from "./company-form";
import { Company, CompanyFormData } from "@/types/company";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  onSubmit,
  isLoading = false,
}: CompanyDialogProps) {
  const isEditing = !!company;

  const handleSubmit = async (data: CompanyFormData) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Company" : "Create New Company"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the company information below."
              : "Fill in the details to create a new company."}
          </DialogDescription>
        </DialogHeader>
        <CompanyForm
          initialData={company}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
