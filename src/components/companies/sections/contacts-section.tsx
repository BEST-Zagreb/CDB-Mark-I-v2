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
import { ContactsTable } from "@/components/contacts/table/contacts-table";
import { ColumnSelector } from "@/components/common/table/column-selector";
import { SearchBar } from "@/components/common/table/search-bar";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { useContactsTable } from "@/hooks/contacts/use-contacts-table";
import { Contact } from "@/types/contact";

interface ContactsSectionProps {
  contacts: Contact[];
  isLoadingContacts: boolean;
  isMobile: boolean;
  onAddContact: () => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: number) => Promise<void>;
}

export function ContactsSection({
  contacts,
  isLoadingContacts,
  isMobile,
  onAddContact,
  onEditContact,
  onDeleteContact,
}: ContactsSectionProps) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts
              <Badge variant="secondary">{contacts.length}</Badge>
            </CardTitle>
            <CardDescription>
              Contacts associated with this company
            </CardDescription>
          </div>

          <Button onClick={onAddContact} size={isMobile ? "sm" : "default"}>
            <Plus className="size-4" />
            Add Contact
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
            onEdit={onEditContact}
            onDelete={onDeleteContact}
            onSortColumn={handleSortColumn}
          />
        )}
      </CardContent>
    </Card>
  );
}
