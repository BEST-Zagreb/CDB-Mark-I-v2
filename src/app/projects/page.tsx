"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectList, ProjectDialog } from "@/components/projects";
import { projectService } from "@/services/project.service";
import { Project, ProjectFormData } from "@/types/project";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    setEditingProject(undefined);
    setDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleSubmitProject = async (data: ProjectFormData) => {
    try {
      setSubmitting(true);

      if (editingProject) {
        // Update existing project
        const updatedProject = await projectService.update(
          editingProject.id,
          data
        );
        setProjects((prev) =>
          prev.map((p) => (p.id === editingProject.id ? updatedProject : p))
        );
        toast.success("Project updated successfully");
      } else {
        // Create new project
        const newProject = await projectService.create(data);
        setProjects((prev) => [newProject, ...prev]);
        toast.success("Project created successfully");
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      toast.error(
        editingProject ? "Failed to update project" : "Failed to create project"
      );
      throw error; // Re-throw to prevent dialog from closing
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await projectService.delete(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
      throw error; // Re-throw to prevent optimistic UI update
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your project database
            </p>
          </div>
          <Button onClick={handleCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Projects</CardTitle>
            <CardDescription>
              A list of all projects in your database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading projects...
              </div>
            ) : (
              <ProjectList
                projects={projects}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                isLoading={submitting}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onSubmit={handleSubmitProject}
        isLoading={submitting}
      />
    </div>
  );
}
