"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, FolderOpen, Users, Building, Home } from "lucide-react";
import { JSX, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  // Helper function to check if a path is active
  const isActivePath = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header>
        <nav className="fixed z-20 inset-x-4 my-4">
          <div
            className={cn(
              "mx-auto max-w-6xl transition-all duration-300 px-2",
              isScrolled &&
                "bg-background/50 max-w-5xl rounded-2xl border backdrop-blur-sm px-4"
            )}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap py-2 sm:py-4">
              <div className="flex items-center justify-between sm:w-auto">
                <div className="flex items-center space-x-2">
                  <SidebarTrigger />

                  <Link href="/" className="flex items-center space-x-2">
                    <Database
                      className={cn(
                        "size-6 sm:size-8 transition-colors",
                        pathname === "/" ? "text-primary" : "text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "font-bold text-lg sm:text-xl transition-colors",
                        pathname === "/" ? "text-primary" : "text-primary"
                      )}
                    >
                      Company Database
                    </span>
                  </Link>
                </div>
              </div>

              <ul className="hidden sm:flex gap-8 text-sm ">
                <li>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center gap-2 duration-150 group hover:scale-110",
                      pathname === "/"
                        ? "text-primary"
                        : "text-muted-foreground hover:text-accent-foreground"
                    )}
                  >
                    <Home
                      className={cn(
                        "size-4 transition-colors",
                        pathname === "/"
                          ? "text-primary"
                          : "group-hover:text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "transition-colors",
                        pathname === "/"
                          ? "text-primary font-bold"
                          : "group-hover:text-primary"
                      )}
                    >
                      Dashboard
                    </span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/projects"
                    className={cn(
                      "flex items-center gap-2 duration-150 group hover:scale-110",
                      isActivePath("/projects")
                        ? "text-primary"
                        : "text-muted-foreground hover:text-accent-foreground"
                    )}
                  >
                    <FolderOpen
                      className={cn(
                        "size-4 transition-colors",
                        isActivePath("/projects")
                          ? "text-primary font-bold"
                          : "group-hover:text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "transition-colors",
                        isActivePath("/projects")
                          ? "text-primary font-bold"
                          : "group-hover:text-primary"
                      )}
                    >
                      Projects
                    </span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/companies"
                    className={cn(
                      "flex items-center gap-2 duration-150 group hover:scale-110",
                      isActivePath("/companies")
                        ? "text-primary"
                        : "text-muted-foreground hover:text-accent-foreground"
                    )}
                  >
                    <Building
                      className={cn(
                        "size-4 transition-colors",
                        isActivePath("/companies")
                          ? "text-primary"
                          : "group-hover:text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "transition-colors",
                        isActivePath("/companies")
                          ? "text-primary font-bold"
                          : "group-hover:text-primary"
                      )}
                    >
                      Companies
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
