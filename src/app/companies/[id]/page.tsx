"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  Users,
  Handshake,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyDialog } from "@/components/companies/company-dialog";
import { PeopleList } from "@/components/people/people-list";
import { PersonDialog } from "@/components/people/person-dialog";
import { CollaborationList } from "@/components/collaborations/collaboration-list";
import { CollaborationDialog } from "@/components/collaborations/collaboration-dialog";
import { companyService } from "@/services/company.service";
import { personService } from "@/services/person.service";
import { collaborationService } from "@/services/collaboration.service";
import { Company, CompanyFormData } from "@/types/company";
import { Person, PersonFormData } from "@/types/person";
import { Collaboration, CollaborationFormData } from "@/types/collaboration";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.id as string);

  const [company, setCompany] = useState<Company | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [peopleLoading, setPeopleLoading] = useState(true);
  const [collaborationsLoading, setCollaborationsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedCollaboration, setSelectedCollaboration] =
    useState<Collaboration | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNaN(companyId)) {
      toast.error("Invalid company ID");
      router.push("/companies");
      return;
    }

    loadCompany();
    loadPeople();
    loadCollaborations();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const data = await companyService.getById(companyId);
      setCompany(data);
    } catch (error) {
      console.error("Error loading company:", error);
      toast.error("Failed to load company");
      router.push("/companies");
    } finally {
      setLoading(false);
    }
  };

  const loadPeople = async () => {
    try {
      setPeopleLoading(true);
      const data = await personService.getByCompany(companyId);
      setPeople(data);
    } catch (error) {
      console.error("Error loading people:", error);
      toast.error("Failed to load people");
    } finally {
      setPeopleLoading(false);
    }
  };

  const loadCollaborations = async () => {
    try {
      setCollaborationsLoading(true);
      const data = await collaborationService.getByCompany(companyId);
      setCollaborations(data);
    } catch (error) {
      console.error("Error loading collaborations:", error);
      toast.error("Failed to load collaborations");
    } finally {
      setCollaborationsLoading(false);
    }
  };

  const handleEditCompany = () => {
    setEditDialogOpen(true);
  };

  const handleSubmitCompany = async (data: CompanyFormData) => {
    if (!company) return;

    try {
      setSubmitting(true);
      const updatedCompany = await companyService.update(company.id, data);
      setCompany(updatedCompany);
      toast.success("Company updated successfully");
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPerson = () => {
    setSelectedPerson(null);
    setPersonDialogOpen(true);
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setPersonDialogOpen(true);
  };

  const handleDeletePerson = async (personId: number) => {
    try {
      await personService.delete(personId);
      toast.success("Person deleted successfully");
      loadPeople();
    } catch (error) {
      console.error("Error deleting person:", error);
      toast.error("Failed to delete person");
    }
  };

  const handleSubmitPerson = async (data: PersonFormData) => {
    try {
      setSubmitting(true);
      if (selectedPerson) {
        await personService.update(selectedPerson.id, data);
        toast.success("Person updated successfully");
      } else {
        await personService.create(data);
        toast.success("Person created successfully");
      }
      loadPeople();
    } catch (error) {
      console.error("Error saving person:", error);
      toast.error("Failed to save person");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCollaboration = () => {
    setSelectedCollaboration(null);
    setCollaborationDialogOpen(true);
  };

  const handleEditCollaboration = (collaboration: Collaboration) => {
    setSelectedCollaboration(collaboration);
    setCollaborationDialogOpen(true);
  };

  const handleDeleteCollaboration = async (collaborationId: number) => {
    try {
      await collaborationService.delete(collaborationId);
      toast.success("Collaboration deleted successfully");
      loadCollaborations();
    } catch (error) {
      console.error("Error deleting collaboration:", error);
      toast.error("Failed to delete collaboration");
    }
  };

  const handleSubmitCollaboration = async (data: CollaborationFormData) => {
    try {
      setSubmitting(true);
      // Ensure companyId is set for new collaborations
      const collaborationData = {
        ...data,
        companyId: data.companyId || companyId,
      };

      if (selectedCollaboration) {
        await collaborationService.update(
          selectedCollaboration.id,
          collaborationData
        );
        toast.success("Collaboration updated successfully");
      } else {
        await collaborationService.create(collaborationData);
        toast.success("Collaboration created successfully");
      }
      loadCollaborations();
    } catch (error) {
      console.error("Error saving collaboration:", error);
      toast.error("Failed to save collaboration");
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const formatUrl = (url: string) => {
    if (!url || url === "null" || url === "") return null;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          Loading company...
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8 text-muted-foreground">
          Company not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/companies")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {company.name}
            </h1>
            <p className="text-muted-foreground">Company Details</p>
          </div>
          <Button onClick={handleEditCompany}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Company
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Company Name
                </label>
                <p className="mt-1 font-medium">{company.name}</p>
              </div>

              {company.url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Website
                  </label>
                  <div className="mt-1">
                    {formatUrl(company.url) ? (
                      <a
                        href={formatUrl(company.url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                      >
                        {company.url}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <p>{company.url}</p>
                    )}
                  </div>
                </div>
              )}

              {company.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <p className="mt-1">{company.phone}</p>
                </div>
              )}

              {company.budgeting_month && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Budgeting Month
                  </label>
                  <p className="mt-1">
                    <Badge variant="outline">{company.budgeting_month}</Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Address
                  </label>
                  <p className="mt-1">{company.address}</p>
                </div>
              )}

              {company.city && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <p className="mt-1">{company.city}</p>
                </div>
              )}

              {company.zip && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ZIP Code
                  </label>
                  <p className="mt-1">{company.zip}</p>
                </div>
              )}

              {company.country && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Country
                  </label>
                  <p className="mt-1">
                    <Badge variant="secondary">{company.country}</Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {company.comment && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{company.comment}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* People Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  People
                </CardTitle>
                <CardDescription>
                  People associated with this company
                </CardDescription>
              </div>
              <Button onClick={handleAddPerson}>
                <Plus className="mr-2 h-4 w-4" />
                Add Person
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <PeopleList
              people={people}
              loading={peopleLoading}
              onEdit={handleEditPerson}
              onDelete={handleDeletePerson}
            />
          </CardContent>
        </Card>

        {/* Collaborations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Collaborations
                </CardTitle>
                <CardDescription>
                  Collaboration history with this company
                </CardDescription>
              </div>
              <Button onClick={handleAddCollaboration}>
                <Plus className="mr-2 h-4 w-4" />
                Add Collaboration
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CollaborationList
              collaborations={collaborations}
              isLoading={collaborationsLoading}
              onEdit={handleEditCollaboration}
              onDelete={handleDeleteCollaboration}
            />
          </CardContent>
        </Card>
      </div>

      <CompanyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
        onSubmit={handleSubmitCompany}
        isLoading={submitting}
      />

      <PersonDialog
        open={personDialogOpen}
        onOpenChange={setPersonDialogOpen}
        person={selectedPerson}
        companyId={companyId}
        onSubmit={handleSubmitPerson}
        isLoading={submitting}
      />

      <CollaborationDialog
        open={collaborationDialogOpen}
        onOpenChange={setCollaborationDialogOpen}
        collaboration={selectedCollaboration}
        projectId={selectedCollaboration?.projectId || 1}
        onSubmit={handleSubmitCollaboration}
        isLoading={submitting}
      />
    </div>
  );
}
