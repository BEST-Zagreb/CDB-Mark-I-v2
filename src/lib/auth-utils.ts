import { db } from "@/lib/db";
import { appUsers } from "@/db/schema";
import { eq, count } from "drizzle-orm";

// Helper function to sync user ID and update last login
async function syncUserIdAndLogin(
  email: string,
  id: string,
  now: string
): Promise<boolean> {
  const [user] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  if (!user || user.isLocked) return false;

  await db.transaction(async (tx) => {
    if (user.id !== id) {
      await tx
        .update(appUsers)
        .set({ addedBy: id })
        .where(eq(appUsers.addedBy, user.id));
      await tx
        .update(appUsers)
        .set({ id, updatedAt: now })
        .where(eq(appUsers.id, user.id));
    }
    await tx
      .update(appUsers)
      .set({ lastLogin: now })
      .where(eq(appUsers.id, id));
  });

  return true;
}

// Helper function to check if error is a unique constraint violation
function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  };

  const hasConstraintCode =
    err.code === "SQLITE_CONSTRAINT" || err.cause?.code === "SQLITE_CONSTRAINT";
  const hasConstraintMessage =
    (err.message?.includes("UNIQUE constraint") ?? false) ||
    (err.cause?.message?.includes("UNIQUE constraint") ?? false);

  return hasConstraintCode && hasConstraintMessage;
}

export async function checkAndCreateUser(userInfo: {
  id: string;
  email: string;
  name: string;
}): Promise<{ authorized: boolean; error?: string }> {
  const { id, email, name } = userInfo;

  if (!email) {
    return {
      authorized: false,
      error: "No email provided by authentication provider.",
    };
  }

  // Check if user exists in appUsers table
  const existingUser = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  // If user exists, sync ID and update last login
  if (existingUser.length > 0) {
    if (existingUser[0].isLocked) {
      return {
        authorized: false,
        error:
          "Your account has been locked. Please contact support for assistance.",
      };
    }

    const now = new Date().toISOString();
    await syncUserIdAndLogin(email, id, now);
    return { authorized: true };
  }

  // User doesn't exist - check if we should auto-create
  const userCount = await db.select({ count: count() }).from(appUsers);
  const totalUsers = userCount[0]?.count || 0;
  const now = new Date().toISOString();

  // Determine user role based on conditions
  let userRole: string | null = null;

  if (totalUsers === 0) {
    userRole = "Administrator"; // First user becomes admin
  } else {
    // Check if user's email domain is in the allowed list
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(",") || [];
    if (
      allowedDomains.length > 0 &&
      allowedDomains.some((domain) => email.endsWith(`@${domain}`))
    ) {
      userRole = "Observer";
    }
  }

  // If user qualifies for auto-creation, create them
  if (userRole) {
    try {
      await db.insert(appUsers).values({
        id,
        fullName: name,
        email,
        role: userRole,
        description: null,
        isLocked: false,
        createdAt: now,
        updatedAt: now,
        addedBy: null,
        lastLogin: now,
      });
      return { authorized: true };
    } catch (error: unknown) {
      // Handle race condition: user was created by another process
      if (isUniqueConstraintError(error)) {
        const synced = await syncUserIdAndLogin(email, id, now);
        if (synced) {
          return { authorized: true };
        }
      }
      throw error;
    }
  }

  // User not authorized
  return {
    authorized: false,
    error: `Account with email ${email} does not have access to CDB. Please login using a valid account or contact support if you believe this is an error.`,
  };
}
