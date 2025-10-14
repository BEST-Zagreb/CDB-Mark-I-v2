import { db } from "@/lib/db";
import { appUsers } from "@/db/schema";
import { eq, count } from "drizzle-orm";

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

  // If user exists, check if they're locked
  if (existingUser.length > 0) {
    if (existingUser[0].isLocked) {
      return {
        authorized: false,
        error:
          "Your account has been locked. Please contact support for assistance.",
      };
    }

    // Update last login
    const now = new Date().toISOString();
    await db
      .update(appUsers)
      .set({ lastLogin: now })
      .where(eq(appUsers.email, email));

    return { authorized: true };
  }

  // User doesn't exist - check if we should auto-create
  const userCount = await db.select({ count: count() }).from(appUsers);
  const totalUsers = userCount[0]?.count || 0;

  const now = new Date().toISOString();

  // First user in the system - create as Administrator
  if (totalUsers === 0) {
    await db.insert(appUsers).values({
      id,
      fullName: name,
      email: email,
      role: "Administrator",
      description: null,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
      addedBy: null,
      lastLogin: now,
    });
    return { authorized: true };
  }

  // Check if user has @best.hr domain
  if (email.endsWith("@best.hr")) {
    await db.insert(appUsers).values({
      id,
      fullName: name,
      email: email,
      role: "Observer",
      description: null,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
      addedBy: null,
      lastLogin: now,
    });
    return { authorized: true };
  }

  // User not authorized
  return {
    authorized: false,
    error: `Account with email ${email} does not have access to CDB. Please login using a valid account or contact support if you believe this is an error.`,
  };
}
