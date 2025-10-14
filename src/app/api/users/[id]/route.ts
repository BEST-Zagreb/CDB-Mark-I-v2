import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { userSchema, type User } from "@/types/user";

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const results = await db
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId));

    if (results.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const u = results[0];
    const formattedUser: User = {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role as any,
      description: u.description,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      addedBy: u.addedBy,
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();

    // Validate the request body
    const validatedData = userSchema.partial().parse(body);

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
    const formattedUser: User = {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role as any,
      description: updatedUser.description,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      addedBy: updatedUser.addedBy,
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

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

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
