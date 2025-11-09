import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

type AuthorizedSessionState = {
  session: ReturnType<typeof useSession>["data"];
  isPending: boolean;
  isAuthorized: boolean | null; // null = not checked yet, true = authorized, false = denied
};

// Global flag to prevent duplicate toasts across multiple hook instances
let toastShownForSession: string | null = null;

export function useAuthorizedSession(): AuthorizedSessionState {
  const { data: session, isPending } = useSession();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const authCheckRef = useRef<{
    checked: boolean;
    sessionId: string | null;
    lastPathname: string | null;
  }>({
    checked: false,
    sessionId: null,
    lastPathname: null,
  });

  useEffect(() => {
    const abortController = new AbortController();

    const checkAuthorization = async () => {
      // If no session, user is on public page (middleware handles protected pages)
      // Set as "authorized" to allow rendering of public UI (login button, etc)
      if (!session?.user?.id) {
        authCheckRef.current = {
          checked: false,
          sessionId: null,
          lastPathname: null,
        };
        toastShownForSession = null; // Reset toast flag when no session
        setIsAuthorized(true); // Allow public access
        return;
      }

      // Check if pathname changed or this is a new session - force recheck
      const pathnameChanged = authCheckRef.current.lastPathname !== pathname;
      const sessionChanged = authCheckRef.current.sessionId !== session.user.id;

      // Skip if we've already checked this session on this pathname
      if (authCheckRef.current.checked && !pathnameChanged && !sessionChanged) {
        return;
      }

      // Only set to null (pending) if this is a new session
      // For pathname changes, keep the previous authorization status to prevent flickering
      if (sessionChanged || !authCheckRef.current.checked) {
        setIsAuthorized(null);
      }

      authCheckRef.current = {
        checked: true,
        sessionId: session.user.id,
        lastPathname: pathname,
      };

      try {
        const response = await fetch("/api/auth/check-authorization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
          }),
          signal: abortController.signal,
        });

        const data = await response.json();

        // Don't process response if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        if (!data.authorized) {
          // Sign out unauthorized user
          await signOut();

          // Show error toast only once per session (prevent duplicate toasts)
          if (toastShownForSession !== session.user.id) {
            toastShownForSession = session.user.id;
            toast.error(data.error || "Access denied", {
              duration: 6000,
            });
          }

          // Mark as not authorized
          setIsAuthorized(false);

          // Navigate to home
          router.push("/");
        } else {
          // User is authorized
          setIsAuthorized(true);
        }
      } catch (error) {
        // Ignore abort errors - they're expected when component unmounts or session changes
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Authorization check failed:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();

    // Cleanup: abort any in-flight requests when session/pathname changes or component unmounts
    return () => {
      abortController.abort();
    };
  }, [session, router, pathname]);

  // Return session only if authorized or no session exists
  // While checking (isAuthorized === null), treat as pending
  return {
    session: isAuthorized === true || !session ? session : null,
    isPending: isPending || isAuthorized === null,
    isAuthorized,
  };
}
