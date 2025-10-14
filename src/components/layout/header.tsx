"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderOpen, Building, Home, Users } from "lucide-react";
import { JSX, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthButton } from "@/components/layout/auth-button";
import { useSession, signOut } from "@/lib/auth-client";
import { toast } from "sonner";

export default function Header(): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const authCheckRef = useRef<{ checked: boolean; sessionId: string | null }>({
    checked: false,
    sessionId: null,
  });

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

  // Check authorization when user logs in
  useEffect(() => {
    const checkAuthorization = async () => {
      // Only check if we have a session and haven't checked this session yet
      if (!session?.user?.id) {
        authCheckRef.current = { checked: false, sessionId: null };
        return;
      }

      // Skip if we've already checked this session
      if (
        authCheckRef.current.checked &&
        authCheckRef.current.sessionId === session.user.id
      ) {
        return;
      }

      authCheckRef.current = { checked: true, sessionId: session.user.id };

      try {
        const response = await fetch("/api/auth/check-authorization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          }),
        });

        const data = await response.json();

        if (!data.authorized) {
          // Sign out unauthorized user
          await signOut();

          // Show error toast after sign out
          toast.error(data.error || "Access denied", {
            duration: 6000,
          });

          // Use Next.js router for navigation (no page reload)
          router.push("/");
        }
      } catch (error) {
        console.error("Authorization check failed:", error);
      }
    };

    checkAuthorization();
  }, [session, router]);

  return (
    <>
      <header>
        <nav className="fixed z-20 inset-x-4 my-4">
          <div
            className={cn(
              "mx-auto max-w-7xl transition-all duration-300 px-4",
              isScrolled &&
                "bg-background/50 max-w-5xl rounded-2xl border backdrop-blur-sm px-4"
            )}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap py-2 sm:py-4">
              <div className="flex items-center justify-between sm:w-auto">
                <div className="flex items-center space-x-2">
                  {isMobile && !isPending && session && <SidebarTrigger />}

                  <Link href="/" className="flex items-center space-x-2">
                    <Image
                      src="/cdb-logo-transparent.png"
                      alt="Company DB logo"
                      width={96}
                      height={96}
                      className="shrink-0 w-10 sm:w-12"
                    />

                    <span
                      className={cn(
                        "font-bold text-lg sm:text-xl transition-colors",
                        pathname === "/" ? "text-primary" : "text-primary"
                      )}
                    >
                      <span className="sm:hidden">CDB</span>
                      <span className="hidden sm:inline">Company Database</span>
                    </span>
                  </Link>
                </div>
              </div>

              {!isPending && session && (
                <ul className="hidden sm:flex gap-8 text-sm">
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
                          "size-5 transition-colors",
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
                        Home
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
                          "size-5 transition-colors",
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
                          "size-5 transition-colors",
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

                  <li>
                    <Link
                      href="/users"
                      className={cn(
                        "flex items-center gap-2 duration-150 group hover:scale-110",
                        isActivePath("/users")
                          ? "text-primary"
                          : "text-muted-foreground hover:text-accent-foreground"
                      )}
                    >
                      <Users
                        className={cn(
                          "size-5 transition-colors",
                          isActivePath("/users")
                            ? "text-primary"
                            : "group-hover:text-primary"
                        )}
                      />
                      <span
                        className={cn(
                          "transition-colors",
                          isActivePath("/users")
                            ? "text-primary font-bold"
                            : "group-hover:text-primary"
                        )}
                      >
                        Users
                      </span>
                    </Link>
                  </li>
                </ul>
              )}

              <AuthButton />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
