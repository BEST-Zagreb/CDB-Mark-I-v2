"use client";

import { useSession, signIn, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogIn, LogOut, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function AuthButton() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isPending) {
    return <div className="h-10 w-32 rounded-full bg-muted animate-pulse" />;
  }

  if (!session) {
    return (
      <Button
        onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}
        variant="default"
        size="sm"
        className="gap-2"
      >
        <LogIn className="h-4 w-4" />
        Login
      </Button>
    );
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Mobile version: Avatar with dropdown menu
  if (isMobile) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded-full">
            {session.user.image && (
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback>
                  {getInitials(session.user.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {/* User info in dropdown for mobile */}
          <div className="flex flex-col gap-1 px-2 py-2">
            <span className="text-sm font-medium">{session.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {session.user.email}
            </span>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              router.push(`/users/${session.user.id}`);
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <User className="size-4" />
            <span>Account Details</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Desktop version: Avatar, Name, Email with chevron dropdown
  return (
    <div className="flex items-center gap-2">
      {/* Avatar, Name, Email - Clickable to user details */}
      <Link
        href={`/users/${session.user.id}`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {session.user.image && (
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={session.user.image}
              alt={session.user.name || "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-tight">
            {session.user.name}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {session.user.email}
          </span>
        </div>
      </Link>

      {/* Chevron with Dropdown Menu */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-min">
          <DropdownMenuItem
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
