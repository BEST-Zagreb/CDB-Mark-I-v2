import { NextRequest, NextResponse } from "next/server";
import { checkAndCreateUser } from "@/lib/auth-utils";

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
