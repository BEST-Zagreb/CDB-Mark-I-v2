import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers } from "@/db/schema";
import { desc } from "drizzle-orm";
import { userSchema, type User } from "@/types/user";

// GET /api/users - Get all users
export async function GET() {
  try {
    const results = await db
      .select()
      .from(appUsers)
      .orderBy(desc(appUsers.createdAt));

    const formattedUsers: User[] = results.map((u) => ({
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
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the request body
    const validatedData = userSchema.parse(body);

    const now = Date.now();

    const nowISO = new Date().toISOString();

    const result = await db
      .insert(appUsers)
      .values({
        id: crypto.randomUUID(),
        fullName: validatedData.fullName,
        email: validatedData.email,
        role: validatedData.role,
        description: validatedData.description ?? null,
        isLocked: validatedData.isLocked ?? false,
        createdAt: nowISO,
        updatedAt: nowISO,
        addedBy: null, // TODO: Get from session
        lastLogin: null,
      })
      .returning();

    if (result && result.length > 0) {
      const newUser = result[0];

      const formattedUser: User = {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role as any,
        description: newUser.description,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        addedBy: newUser.addedBy,
        lastLogin: newUser.lastLogin,
        isLocked: newUser.isLocked,
      };

      return NextResponse.json(formattedUser, { status: 201 });
    } else {
      throw new Error("Failed to create user");
    }
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid user data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
