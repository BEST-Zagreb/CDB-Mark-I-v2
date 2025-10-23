"use client";

import { memo, useEffect } from "react";
import { FolderOpen, Building, Home, Users } from "lucide-react";

import Link from "next/link";
import Image from "next/image";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

export const AppSidebar = memo(function AppSidebar() {
  const { setOpen } = useSidebar();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Close sidebar when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sidebar variant="floating" className="mt-24 h-fit">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <Link href="/" className="flex items-center space-x-2 py-2">
              <Image
                src="/cdb-logo-transparent.png"
                alt="Company DB logo"
                width={48}
                height={48}
                className="shrink-0 w-8"
              />
              <span className="font-semibold text-lg">Company Database</span>
            </Link>
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

              {/* Projects */}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/projects"
                    className={`flex items-center gap-2 ${
                      pathname.startsWith("/projects")
                        ? "text-primary bg-accent font-bold"
                        : ""
                    }`}
                  >
                    <FolderOpen className="size-5" />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Companies */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/companies"
                    className={`flex items-center gap-2 ${
                      pathname.startsWith("/companies")
                        ? "text-primary bg-accent font-bold"
                        : ""
                    }`}
                  >
                    <Building className="size-5" />
                    <span>Companies</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Users */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="/users"
                    className={`flex items-center gap-2 ${
                      pathname.startsWith("/users")
                        ? "text-primary bg-accent font-bold"
                        : ""
                    }`}
                  >
                    <Users className="size-5" />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
});
