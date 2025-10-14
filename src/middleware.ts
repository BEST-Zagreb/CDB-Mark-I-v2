import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to these paths without authentication
  const publicPaths = ["/", "/sign-in", "/api/auth"];

  // Check if the path is public or an auth route
  const isPublicPath = publicPaths.some((path) => pathname === path);
  const isAuthRoute = pathname.startsWith("/api/auth");

  // Allow public paths and auth routes
  if (isPublicPath || isAuthRoute) {
    return NextResponse.next();
  }

  // Check if user has a valid session
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }
  );

  // If no session, redirect to home page
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Add a query parameter to show login prompt
    url.searchParams.set("auth_required", "true");
    return NextResponse.redirect(url);
  }

  // User is authenticated, allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
