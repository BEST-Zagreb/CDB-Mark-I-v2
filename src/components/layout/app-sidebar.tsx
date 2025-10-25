"use client";

import { memo, use, useEffect } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";

const navigationLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/companies", label: "Companies", icon: Building },
  { href: "/users", label: "Users", icon: Users },
];

export const AppSidebar = memo(function AppSidebar() {
  const { setOpenMobile, setOpen } = useSidebar();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Close sidebar when route changes
  useEffect(() => {
    setOpenMobile(false);
    setOpen(false);
  }, [pathname, setOpenMobile]);

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
              {navigationLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={link.href}
                      className={`flex items-center gap-2 ${
                        pathname === link.href
                          ? "text-primary bg-accent font-bold"
                          : ""
                      }`}
                    >
                      <link.icon className="size-5" />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
});
