import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers, collaborations } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { userSchema, type User, type UserRoleType } from "@/types/user";
import { checkIsAdmin } from "@/lib/server-auth";
import { resolveAddedByUser } from "@/lib/user-utils";

// GET /api/users - Get all users
export async function GET() {
  try {
    const addedByUser = alias(appUsers, "addedByUser");

    // Fetch all users
    const results = await db
      .select({
        user: appUsers,
        addedByFullName: addedByUser.fullName,
        addedByEmail: addedByUser.email,
      })
      .from(appUsers)
      .leftJoin(addedByUser, eq(addedByUser.id, appUsers.addedBy))
      .orderBy(desc(appUsers.createdAt));

    // Get distinct users who have collaborations (use index on responsible)
    const usersWithCollaborations = await db
      .selectDistinct({ responsible: collaborations.responsible })
      .from(collaborations)
      .where(sql`${collaborations.responsible} IS NOT NULL`);

    const collaboratorsSet = new Set(
      usersWithCollaborations.map((row) => row.responsible)
    );

    const formattedUsers: User[] = results.map(
      ({ user: u, addedByFullName, addedByEmail }) => {
        // Check if user has collaborations
        const hasCollaborations = collaboratorsSet.has(u.fullName);

        // If user's role is not Administrator or Project responsible, and they have collaborations,
        // display them as Project team member
        let role = u.role as UserRoleType;
        if (
          role !== "Administrator" &&
          role !== "Project responsible" &&
          hasCollaborations
        ) {
          role = "Project team member";
        }

        return {
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          role: role,
          description: u.description,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          addedBy: u.addedBy,
          addedByUser: u.addedBy
            ? { id: u.addedBy, fullName: addedByFullName, email: addedByEmail }
            : null,
          lastLogin: u.lastLogin,
          isLocked: u.isLocked,
        };
      }
    );

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
    // Check if user is an administrator
    const authCheck = await checkIsAdmin(request);
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: authCheck.error || "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate the request body
    const validatedData = userSchema.parse(body);

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
        addedBy: authCheck.userId,
        lastLogin: null,
      })
      .returning();

    if (result && result.length > 0) {
      const newUser = result[0];
      const addedByInfo = await resolveAddedByUser(newUser.addedBy);

      const formattedUser: User = {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role as UserRoleType,
        description: newUser.description,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        addedBy: newUser.addedBy,
        addedByUser: addedByInfo,
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
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
