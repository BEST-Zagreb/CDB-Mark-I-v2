"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contactService } from "@/services/contact.service";
import { Contact, ContactFormData } from "@/types/contact";
import { toast } from "sonner";

// Query keys
export const contactKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactKeys.all, "list"] as const,
  list: (filters?: { companyId?: number }) =>
    [...contactKeys.lists(), { filters }] as const,
  details: () => [...contactKeys.all, "detail"] as const,
  detail: (id: number) => [...contactKeys.details(), id] as const,
  byCompany: (companyId: number) =>
    [...contactKeys.all, "company", companyId] as const,
};

// Custom hooks
export function useContacts() {
  return useQuery({
    queryKey: contactKeys.list(),
    queryFn: contactService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useContactsByCompany(companyId: number) {
  return useQuery({
    queryKey: contactKeys.byCompany(companyId),
    queryFn: () => contactService.getByCompany(companyId),
    enabled: !!companyId && !isNaN(companyId) && companyId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useContact(id: number) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactService.getById(id),
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContactFormData) => {
      return contactService.create(data);
    },
    onSuccess: async (newContact) => {
      // Invalidate and refetch all contact queries
      await queryClient.invalidateQueries({ queryKey: contactKeys.all });

      // Specifically invalidate and refetch company-specific queries
      if (newContact?.companyId) {
        await queryClient.invalidateQueries({
          queryKey: contactKeys.byCompany(newContact.companyId),
        });

        // Force refetch of the company-specific contacts
        await queryClient.refetchQueries({
          queryKey: contactKeys.byCompany(newContact.companyId),
        });
      }

      toast.success("Contact created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create contact");
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        companyId: number;
        email?: string;
        phone?: string;
        function?: string;
      };
    }) => contactService.update(id, data),
    onSuccess: (updatedContact) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      if (updatedContact?.id) {
        queryClient.setQueryData(
          contactKeys.detail(updatedContact.id),
          updatedContact
        );
        // Invalidate company-specific queries
        if (updatedContact.companyId) {
          queryClient.invalidateQueries({
            queryKey: contactKeys.byCompany(updatedContact.companyId),
          });
        }
      }
      toast.success("Contact updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update contact");
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => {
      return contactService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      toast.success("Contact deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete contact");
    },
  });
}
