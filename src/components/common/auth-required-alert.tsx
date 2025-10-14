"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";

/**
 * Alert component that displays when authentication is required.
 * Checks for 'auth_required=true' query parameter set by middleware.
 * Must be wrapped in a Suspense boundary.
 */
export function AuthRequiredAlert() {
  const searchParams = useSearchParams();
  const [showAuthAlert, setShowAuthAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get("auth_required") === "true") {
      setShowAuthAlert(true);
    }
  }, [searchParams]);

  if (!showAuthAlert) return null;

  return (
    <div className="mt-4 w-fit mx-auto">
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>
          Authentication is required for accessing this page.
        </AlertTitle>
      </Alert>
    </div>
  );
}
