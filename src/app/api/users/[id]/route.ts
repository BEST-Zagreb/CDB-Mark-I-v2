import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers, collaborations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { userSchema, type User, type UserRoleType } from "@/types/user";
import { checkIsAdmin } from "@/lib/server-auth";
import { resolveAddedByUser } from "@/lib/user-utils";

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get user and check if they have any collaborations
    const addedByUser = alias(appUsers, "addedByUser");

    const results = await db
      .select({
        user: appUsers,
        hasCollaborations: sql<number>`EXISTS (
          SELECT 1 FROM ${collaborations} 
          WHERE ${collaborations.responsible} = ${appUsers.fullName}
        )`,
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

    // If user's role is not Administrator or Project responsible, and they have collaborations,
    // display them as Project team member
    let role = u.role as UserRoleType;
    if (
      role !== "Administrator" &&
      role !== "Project responsible" &&
      result.hasCollaborations
    ) {
      role = "Project team member";
    }

    const formattedUser: User = {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: role,
      description: u.description,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      addedBy: u.addedBy,
      addedByUser: await resolveAddedByUser(u.addedBy),
      lastLogin: u.lastLogin,
      isLocked: u.isLocked,
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

    // Fetch the user to check their role
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
      if (existingUser[0].role === "Administrator") {
        return NextResponse.json(
          { error: "Cannot lock administrator accounts" },
          { status: 403 }
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
    const addedByInfo = await resolveAddedByUser(updatedUser.addedBy);
    const formattedUser: User = {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role as UserRoleType,
      description: updatedUser.description,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      addedBy: updatedUser.addedBy,
      addedByUser: addedByInfo,
      lastLogin: updatedUser.lastLogin,
      isLocked: updatedUser.isLocked,
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

    const result = await db
      .delete(appUsers)
      .where(eq(appUsers.id, userId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
