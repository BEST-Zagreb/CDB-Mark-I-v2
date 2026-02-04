import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers, collaborations, user, session } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { userSchema, type User } from "@/types/user";
import { checkIsAdmin } from "@/lib/server-auth";
import { resolveAddedByUser } from "@/lib/user-utils";

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get user info
    const addedByUser = alias(appUsers, "addedByUser");

    const results = await db
      .select({
        user: appUsers,
        addedByFullName: addedByUser.fullName,
        addedByEmail: addedByUser.email,
      })
      .from(appUsers)
      .leftJoin(addedByUser, eq(addedByUser.id, appUsers.addedBy))
      .where(eq(appUsers.id, userId));

    if (results.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = results[0];
    const u = result.user;

    const formattedUser: User = {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      description: u.description,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      addedBy: u.addedBy,
      addedByUser: await resolveAddedByUser(u.addedBy),
      lastLogin: u.lastLogin,
      isLocked: u.isLocked,
      isAdmin: u.isAdmin ?? false,
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Check if user is an administrator or editing their own profile
    const authCheck = await checkIsAdmin(request);
    const isEditingOwnProfile = authCheck.userId === userId;

    if (!authCheck.isAdmin && !isEditingOwnProfile) {
      return NextResponse.json(
        { error: "Unauthorized: You can only edit your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = userSchema.partial().parse(body);

    // If user is editing their own profile (non-admin), restrict what they can change
    if (isEditingOwnProfile && !authCheck.isAdmin) {
      // Non-admin users can only edit fullName and description
      const allowedFields = ["fullName", "description"];
      const attemptedFields = Object.keys(validatedData);
      const unauthorizedFields = attemptedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (unauthorizedFields.length > 0) {
        return NextResponse.json(
          {
            error: `You can only edit your name and description. Cannot edit: ${unauthorizedFields.join(
              ", "
            )}`,
          },
          { status: 403 }
        );
      }
    }

    // Fetch the user to check admin status / lock status
    const existingUser = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if trying to lock an admin account
    if (
      validatedData.isLocked !== undefined &&
      validatedData.isLocked === true
    ) {
      // Prevent locking administrator accounts
      if (existingUser[0].isAdmin) {
        return NextResponse.json(
          { error: "Cannot lock administrator accounts" },
          { status: 403 }
        );
      }
    }

    // Prevent removing admin rights from the last administrator
    if (validatedData.isAdmin === false && existingUser[0].isAdmin) {
      const adminCount = await db
        .select({ count: count() })
        .from(appUsers)
        .where(eq(appUsers.isAdmin, true));

      const totalAdmins = adminCount[0]?.count || 0;
      if (totalAdmins <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot remove administrator rights from the last administrator account.",
          },
          { status: 400 }
        );
      }
    }

    const nowISO = new Date().toISOString();

    const result = await db
      .update(appUsers)
      .set({
        ...validatedData,
        updatedAt: nowISO,
      })
      .where(eq(appUsers.id, userId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = result[0];

    // If user was locked, invalidate all their sessions to force logout
    if (validatedData.isLocked === true && updatedUser.isLocked) {
      await db.delete(session).where(eq(session.userId, userId));
    }

    const addedByInfo = await resolveAddedByUser(updatedUser.addedBy);
    const formattedUser: User = {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      description: updatedUser.description,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      addedBy: updatedUser.addedBy,
      addedByUser: addedByInfo,
      lastLogin: updatedUser.lastLogin,
      isLocked: updatedUser.isLocked,
      isAdmin: updatedUser.isAdmin ?? false,
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid user data", details: error },
        { status: 400 }
      );
    }

    // Check for unique constraint violation (duplicate email)
    // Check the error itself and its cause chain
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      const errorCause = (error as Error & { cause?: { code?: string } }).cause;

      // Check if it's a SQLITE_CONSTRAINT error
      if (
        errorMessage.includes("unique constraint failed") ||
        errorMessage.includes("sqlite_constraint") ||
        (errorCause &&
          (errorCause.code === "SQLITE_CONSTRAINT" ||
            String(errorCause).toLowerCase().includes("unique constraint")))
      ) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is an administrator
    const authCheck = await checkIsAdmin(request);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error || "Unauthorized" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Check if user is trying to delete themselves
    const isDeletingSelf = authCheck.userId === userId;

    // Get the user being deleted
    const userToDelete = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1);

    if (userToDelete.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If deleting an Administrator, check if they're the last one
    if (userToDelete[0].isAdmin) {
      const adminCount = await db
        .select({ count: count() })
        .from(appUsers)
        .where(eq(appUsers.isAdmin, true));

      const totalAdmins = adminCount[0]?.count || 0;

      if (totalAdmins <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot delete the last administrator account. Please assign another user as administrator first.",
          },
          { status: 400 }
        );
      }
    }

    // Delete from appUsers first
    const appUserResult = await db
      .delete(appUsers)
      .where(eq(appUsers.id, userId))
      .returning();

    if (appUserResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete from Better Auth user table (this will cascade delete sessions via FK)
    await db.delete(user).where(eq(user.id, userId));

    return NextResponse.json({
      message: "User deleted successfully",
      deletedSelf: isDeletingSelf,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
