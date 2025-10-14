"use client";

import { memo, useState, useEffect } from "react";
import {
  ChevronDown,
  Database,
  FolderOpen,
  Building,
  Home,
  Users,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { projectService } from "@/services/project.service";
import { Project } from "@/types/project";
import { BlocksWaveLoader } from "@/components/common/blocks-wave-loader";
import { useSession } from "@/lib/auth-client";

type OpenSection = "projects" | "companies" | null;

export const AppSidebar = memo(function AppSidebar() {
  const [openMenu, setOpenMenu] = useState<OpenSection>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const { setOpen, open, state } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Helper function to check if a path is active
  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Fetch projects when sidebar is expanded and user is authenticated
  useEffect(() => {
    if (state === "expanded" && session) {
      setLoadingProjects(true);
      projectService
        .getAll()
        .then((data) => {
          // Ensure data is an array before setting
          if (Array.isArray(data)) {
            setProjects(data);
          } else {
            setProjects([]);
          }
        })
        .catch((error) => {
          console.error("Error fetching projects:", error);
          setProjects([]);
        })
        .finally(() => setLoadingProjects(false));
    } else if (!session) {
      // Clear projects if no session
      setProjects([]);
    }
  }, [state, session]);

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
              {/* Home */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/"
                    className={`flex items-center gap-2 ${
                      pathname === "/" ? "text-primary bg-accent font-bold" : ""
                    }`}
                  >
                    <Home className="size-5" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Projects with collapsible list - only show when authenticated */}

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
                        className={`flex items-center gap-2 ${
                          isActivePath("/projects")
                            ? "text-primary bg-accent font-bold"
                            : ""
                        }`}
                      >
                        <FolderOpen className="size-5" />
                        <span>Projects</span>
                      </Link>
                    </SidebarMenuButton>

                    {/* Separate chevron trigger for collapsible */}
                    {session && (
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
                    )}
                  </div>

                  {session && (
                    <CollapsibleContent>
                      <SidebarMenuSub className="max-h-128 overflow-y-auto">
                        {loadingProjects ? (
                          <SidebarMenuSubItem>
                            <BlocksWaveLoader size={32} />
                          </SidebarMenuSubItem>
                        ) : projects.length === 0 ? (
                          <SidebarMenuSubItem>
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              No projects found
                            </div>
                          </SidebarMenuSubItem>
                        ) : (
                          projects.map((project) => (
                            <SidebarMenuSubItem key={project.id}>
                              <Link
                                href={`/projects/${project.id}`}
                                className={`flex items-center space-x-2 w-full rounded-md px-2 py-1 ${
                                  pathname === `/projects/${project.id}`
                                    ? "bg-accent text-accent-foreground font-bold"
                                    : "hover:bg-accent hover:text-accent-foreground"
                                }`}
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
                  )}
                </Collapsible>
              </SidebarMenuItem>

              {/* Companies - only show when authenticated */}
              {session && (
                <SidebarMenuItem>
                  <Collapsible
                    open={openMenu === "companies"}
                    onOpenChange={(open) =>
                      setOpenMenu(open ? "companies" : null)
                    }
                    className="group/collapsible"
                  >
                    <div className="flex items-center">
                      {/* Main link to companies page */}
                      <SidebarMenuButton asChild className="flex-1">
                        <Link
                          href="/companies"
                          className={`flex items-center gap-2 ${
                            isActivePath("/companies")
                              ? "text-primary bg-accent font-medium"
                              : ""
                          }`}
                        >
                          <Building className="size-5" />
                          <span>Companies</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  </Collapsible>
                </SidebarMenuItem>
              )}

              {/* Users - only show when authenticated */}
              {session && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link
                      href="/users"
                      className={`flex items-center gap-2 ${
                        isActivePath("/users")
                          ? "text-primary bg-accent font-bold"
                          : ""
                      }`}
                    >
                      <Users className="size-5" />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
});
