"use client";

import { memo, useState, useEffect } from "react";
import {
  ChevronDown,
  Database,
  FolderOpen,
  Users,
  Building,
  Handshake,
  FileText,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { projectService } from "@/services/project.service";
import { Project } from "@/types/project";

type OpenSection = "projects" | null;

export const AppSidebar = memo(function AppSidebar() {
  const [openMenu, setOpenMenu] = useState<OpenSection>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { setOpen, open, state } = useSidebar();
  const pathname = usePathname();

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Fetch projects when projects menu is opened
  useEffect(() => {
    if (state === "expanded") {
      setLoadingProjects(true);
      projectService
        .getAll()
        .then(setProjects)
        .catch(console.error)
        .finally(() => setLoadingProjects(false));
    }
  }, [state]);

  return (
    <Sidebar variant="floating" className="mt-24 h-fit">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center space-x-2 py-2">
              <Database className="size-6 text-primary" />
              <span className="font-semibold text-lg">Company Database</span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent className="max-h-[75dvh] min-h-0 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Projects with collapsible list */}
              <SidebarMenuItem>
                <Collapsible
                  open={openMenu === "projects"}
                  onOpenChange={(open) => setOpenMenu(open ? "projects" : null)}
                  className="group/collapsible"
                >
                  <div className="flex items-center">
                    {/* Main link to projects page */}
                    <SidebarMenuButton asChild className="flex-1">
                      <Link
                        href="/projects"
                        className="flex items-center gap-2"
                      >
                        <FolderOpen />
                        <span>Projects</span>
                      </Link>
                    </SidebarMenuButton>

                    {/* Separate chevron trigger for collapsible */}
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        <span className="sr-only">Toggle Projects</span>
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <SidebarMenuSub className="max-h-128 overflow-y-auto">
                      {loadingProjects ? (
                        <SidebarMenuSubItem>
                          <div className="text-sm text-muted-foreground px-2">
                            Loading projects...
                          </div>
                        </SidebarMenuSubItem>
                      ) : (
                        projects.map((project) => (
                          <SidebarMenuSubItem key={project.id}>
                            <Link
                              href={`/projects/${project.id}`}
                              className="flex items-center space-x-2 w-full hover:bg-accent hover:text-accent-foreground rounded-md px-2 py-1"
                            >
                              {/* <FileText className="h-4 w-4" /> */}
                              <div className="flex flex-col min-w-0">
                                <span className="truncate text-sm">
                                  {project.name}
                                </span>
                              </div>
                            </Link>
                          </SidebarMenuSubItem>
                        ))
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Building className="h-4 w-4" />
                  <span className="text-muted-foreground">
                    Companies (Coming Soon)
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
});
