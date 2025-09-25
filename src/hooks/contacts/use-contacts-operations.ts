"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useContactsByCompany,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "@/hooks/contacts/use-contacts";
import { Contact, ContactFormData } from "@/types/contact";

export function useContactsOperations(companyId: number) {
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();

  // React Query hooks
  const { data: contacts = [], isLoading: isLoadingContacts } =
    useContactsByCompany(companyId);

  // Mutation hooks
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();

  const handleAddContact = () => {
    setSelectedContact(undefined);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactDialogOpen(true);
  };

  const handleDeleteContact = async (contactId: number) => {
    await deleteContactMutation.mutateAsync(contactId);
  };

  const handleSubmitContact = async (data: ContactFormData) => {
    try {
      if (!companyId || isNaN(companyId) || companyId <= 0) {
        toast.error("Invalid company ID");
        return;
      }

      const contactData = { ...data, companyId };

      if (selectedContact) {
        await updateContactMutation.mutateAsync({
          id: selectedContact.id,
          data: contactData,
        });
      } else {
        await createContactMutation.mutateAsync(contactData);
      }
      setContactDialogOpen(false);
    } catch (error) {
      console.error("Error in handleSubmitContact:", error);
      // Don't close dialog on error
    }
  };

  const isSubmitting =
    createContactMutation.isPending ||
    updateContactMutation.isPending ||
    deleteContactMutation.isPending;

  return {
    contacts,
    isLoadingContacts,
    contactDialogOpen,
    setContactDialogOpen,
    selectedContact,
    handleAddContact,
    handleEditContact,
    handleDeleteContact,
    handleSubmitContact,
    isSubmitting,
  };
}
