"use client";

import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContactsTable } from "@/app/companies/[id]/components/contacts/table/contacts-table";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { FormDialog } from "@/components/common/form-dialog";
import { ContactForm } from "@/app/companies/[id]/components/contacts/contacts-form";
import { useContactsTable } from "@/app/companies/[id]/hooks/use-contacts-table";
import { useContactsOperations } from "@/app/companies/[id]/hooks/use-contacts-operations";
import { Contact, ContactFormData } from "@/types/contact";
import { useIsMobile } from "@/hooks/use-mobile";

interface ContactsSectionProps {
  companyId: number;
}

export function ContactsSection({ companyId }: ContactsSectionProps) {
  const isMobile = useIsMobile();

  const {
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
  } = useContactsOperations(companyId);

  const {
    tablePreferences,
    searchQuery,
    handleUpdateVisibleColumns,
    handleSortColumn,
    handleSearchChange,
    contactFields,
    visibleColumnsString,
  } = useContactsTable();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Users className="h-5 w-5" />
                Contacts
                <Badge variant="secondary">{contacts.length}</Badge>
              </CardTitle>
              <CardDescription>
                Contacts associated with this company
              </CardDescription>
            </div>

            <Button onClick={handleAddContact} size={isMobile ? "icon" : "default"}>
              <Plus className="size-4" />
              {!isMobile && "Add Contact"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar and Column Selector */}
          <div className="flex flex-row flex-wrap gap-4 items-center justify-between">
            <SearchBar
              placeholder="Search contacts..."
              onSearchChange={handleSearchChange}
              searchParam="contacts_search"
            />

            <ColumnSelector
              fields={contactFields}
              visibleColumns={visibleColumnsString}
              onColumnsChange={handleUpdateVisibleColumns}
              placeholder="Select columns"
            />
          </div>

          {isLoadingContacts ? (
            <BlocksWaveLoader size={48} />
          ) : (
            <ContactsTable
              contacts={contacts}
              searchQuery={searchQuery}
              tablePreferences={tablePreferences}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              onSortColumn={handleSortColumn}
            />
          )}
        </CardContent>
      </Card>

      <FormDialog<Contact>
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        entity="Contact"
        initialData={selectedContact}
        onSubmit={handleSubmitContact}
        isLoading={isSubmitting}
      >
        {(formProps) => (
          <ContactForm
            initialData={formProps.initialData}
            companyId={companyId}
            onSubmit={formProps.onSubmit}
            isLoading={formProps.isLoading}
          />
        )}
      </FormDialog>
    </>
  );
}
