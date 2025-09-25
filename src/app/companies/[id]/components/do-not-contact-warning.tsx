"use client";

import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DoNotContactWarning() {
  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-900 flex items-center gap-4">
      <AlertTriangle className="size-7 shrink-0" />

      <div>
        <AlertTitle>Do Not Contact Warning</AlertTitle>
        <AlertDescription>
          This company has been marked as "do not contact in future" in one or
          more collaborations. Please review collaboration history before
          initiating new contact.
        </AlertDescription>
      </div>
    </Alert>
  );
}
