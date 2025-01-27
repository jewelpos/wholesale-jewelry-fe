// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnvironmentConfig } from "./lib/config/environment";

const envConfig = getEnvironmentConfig();
const basePath = envConfig.basePath;

// Define protected routes that require authentication
const protectedRoutes = ["/jw/admin_dashboard", "/jw/create/store"];
// Define public routes that don't need authentication
const publicRoutes = ["/jw/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get("accessToken")?.value;

  // If root path ('/'), redirect based on auth status
  if (pathname === "/" || pathname === "/jw") {
    return authToken
      ? NextResponse.redirect(new URL("/jw/admin_dashboard", request.url))
      : NextResponse.redirect(new URL("/jw/login", request.url));
  }

  // For auth pages (login, register, etc)
  if (publicRoutes.includes(pathname)) {
    // If user is logged in, redirect to dashboard
    return authToken
      ? NextResponse.redirect(new URL("/jw/admin_dashboard", request.url))
      : NextResponse.next();
  }

  // For protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // If user is not logged in, redirect to login
    return !authToken
      ? NextResponse.redirect(new URL("/jw/login", request.url))
      : NextResponse.next();
  }

  // For all other routes, proceed normally
  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
