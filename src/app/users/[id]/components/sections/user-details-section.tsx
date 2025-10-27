"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "@/types/user";

interface UserDetailsSectionProps {
  user: User;
}

export function UserDetailsSection({ user }: UserDetailsSectionProps) {
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";

    let dateObj: Date;
    if (typeof date === "string") {
      if (date === "null" || date === "") return "-";
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return "-";

    return new Intl.DateTimeFormat("hr-HR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Row 1: Full Name and Email */}
        <div className="flex flex-wrap items-center justify-left gap-6">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Full Name
            </label>
            <p className="mt-1 text-sm font-medium">{user.fullName || "-"}</p>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="mt-1 text-sm">{user.email || "-"}</p>
          </div>
        </div>

        {/* Row 2: Role and Status */}
        <div className="flex flex-wrap items-center justify-left gap-6">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Role
            </label>
            <p className="mt-1 text-sm">{user.role || "-"}</p>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Account Locked Status
            </label>
            <p className="mt-1 text-sm">
              {user.isLocked ? (
                <span className="flex items-center gap-2 text-primary font-medium">
                  <Lock className="h-4 w-4" />
                  Locked
                </span>
              ) : (
                <span className="font-medium">Unlocked</span>
              )}
            </p>
          </div>
        </div>

        {/* Row 3: Description */}
        {user.description && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            <p className="mt-1 text-sm">{user.description}</p>
          </div>
        )}

        {/* Row 4: Last Login */}
        <div className="flex flex-wrap items-center justify-left gap-6">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Last Login
            </label>
            <p className="mt-1 text-sm">
              {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
            </p>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Added By
            </label>
            {user.addedByUser ? (
              <div className="mt-1 flex items-center gap-1">
                <Link
                  href={`/users/${user.addedByUser?.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {user.addedByUser.fullName}
                </Link>
                <span className="text-xs text-muted-foreground">
                  ({user.addedByUser?.email})
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm">-</p>
            )}
          </div>
        </div>

        {/* Row 5: Created and Updated */}
        <div className="flex flex-wrap items-center justify-left gap-6">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Created
            </label>
            <p className="mt-1 text-sm">{formatDate(user.createdAt)}</p>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Last Updated
            </label>
            <p className="mt-1 text-sm">{formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
