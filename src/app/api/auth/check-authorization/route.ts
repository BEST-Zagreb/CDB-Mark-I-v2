import { NextRequest, NextResponse } from "next/server";
import { checkAndCreateUser } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name } = body;

    if (!id || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, verify the session actually exists in the database
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id || session.user.id !== id) {
      return NextResponse.json(
        { authorized: false, error: "Session not found or invalid" },
        { status: 401 }
      );
    }

    const result = await checkAndCreateUser({ id, email, name: name || "" });

    if (!result.authorized) {
      return NextResponse.json(
        { authorized: false, error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({ authorized: true });
  } catch (error) {
    console.error("Error checking user authorization:", error);
    return NextResponse.json(
      { error: "Failed to check authorization" },
      { status: 500 }
    );
  }
}
