import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { appUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current session from the request
 */
export async function getSession(request: NextRequest) {
  return await auth.api.getSession({ headers: request.headers });
}

/**
 * Check if the current user is an administrator
 * @returns { isAdmin: boolean, userId: string | null, error?: string }
 */
export async function checkIsAdmin(request: NextRequest) {
  const session = await getSession(request);

  if (!session?.user?.id) {
    return {
      isAdmin: false,
      userId: null,
      error: "Not authenticated",
    };
  }

  const userId = session.user.id;

  // Fetch user from database to check role
  const users = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, userId))
    .limit(1);

  if (users.length === 0) {
    return {
      isAdmin: false,
      userId,
      error: "User not found in database",
    };
  }

  const user = users[0];

  // Check if user is locked
  if (user.isLocked) {
    return {
      isAdmin: false,
      userId,
      error: "Account is locked",
    };
  }

  // Check if user is an administrator
  const isAdmin = user.role === "Administrator";

  return {
    isAdmin,
    userId,
    error: isAdmin ? undefined : "Insufficient permissions",
  };
}
