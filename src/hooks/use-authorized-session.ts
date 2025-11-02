import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type AuthorizedSessionState = {
  session: ReturnType<typeof useSession>["data"];
  isPending: boolean;
  isAuthorized: boolean | null; // null = not checked yet, true = authorized, false = denied
};

export function useAuthorizedSession(): AuthorizedSessionState {
  const { data: session, isPending } = useSession();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const authCheckRef = useRef<{
    checked: boolean;
    sessionId: string | null;
    lastCheck: number;
  }>({
    checked: false,
    sessionId: null,
    lastCheck: 0,
  });

  useEffect(() => {
    const checkAuthorization = async () => {
      // If no session, mark as authorized (public access)
      if (!session?.user?.id) {
        authCheckRef.current = {
          checked: false,
          sessionId: null,
          lastCheck: 0,
        };
        setIsAuthorized(true);
        return;
      }

      const now = Date.now();
      const timeSinceLastCheck = now - authCheckRef.current.lastCheck;
      const RECHECK_INTERVAL = 30000; // 30 seconds

      // Skip if we've already checked this session recently (within 30 seconds)
      if (
        authCheckRef.current.checked &&
        authCheckRef.current.sessionId === session.user.id &&
        timeSinceLastCheck < RECHECK_INTERVAL
      ) {
        return;
      }

      // Mark as checking (null = in progress)
      setIsAuthorized(null);
      authCheckRef.current = {
        checked: true,
        sessionId: session.user.id,
        lastCheck: now,
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
        });

        const data = await response.json();

        if (!data.authorized) {
          // Sign out unauthorized user
          await signOut();

          // Show error toast after sign out
          toast.error(data.error || "Access denied", {
            duration: 6000,
          });

          // Mark as not authorized
          setIsAuthorized(false);

          // Navigate to home
          router.push("/");
        } else {
          // User is authorized
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Authorization check failed:", error);
        setIsAuthorized(false);
      }
    };

    checkAuthorization();

    // Set up periodic re-checking every 30 seconds
    const intervalId = setInterval(checkAuthorization, 30000);

    return () => clearInterval(intervalId);
  }, [session, router]);

  // Return session only if authorized or no session exists
  // While checking (isAuthorized === null), treat as pending
  return {
    session: isAuthorized === true || !session ? session : null,
    isPending: isPending || isAuthorized === null,
    isAuthorized,
  };
}
