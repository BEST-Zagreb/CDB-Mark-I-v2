"use client";
import Link from "next/link";
import { Database, FolderOpen, Users, Building } from "lucide-react";
import { JSX, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();

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
                    <Database className="size-6 sm:size-8 text-primary" />
                    <span className="font-bold text-lg sm:text-xl text-primary">
                      Company Database
                    </span>
                  </Link>
                </div>
              </div>

              <ul className="hidden sm:flex gap-8 text-sm ">
                <li>
                  <Link
                    href="/projects"
                    className="flex items-center space-x-2 text-muted-foreground hover:text-accent-foreground block duration-150 group hover:scale-110"
                  >
                    <FolderOpen className="size-4 group-hover:text-primary transition-colors" />
                    <span className="group-hover:text-primary transition-colors">
                      Projects
                    </span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="#"
                    className="flex items-center space-x-2 text-muted-foreground/50 cursor-not-allowed block duration-150"
                  >
                    <Building className="size-4" />
                    <span>Companies (Soon)</span>
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
