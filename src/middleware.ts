import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = [
    "/",
    "/jw",
    "/jw/login",
    "/jw/register",
    "/jw/forgot_password",
  ];

  // Skip middleware for static files and images
  if (
    pathname.startsWith("/_next") || // Next.js internal routes
    pathname.startsWith("/api") || // API routes
    pathname.includes(".") || // Files with extensions (images, etc)
    pathname.startsWith("/public") || // Public directory
    pathname.startsWith("/images") || // Image directory if you have one
    pathname.startsWith("/assets") // Assets directory if you have one
  ) {
    return NextResponse.next();
  }

  // /unauthorized must always be reachable regardless of auth state
  if (pathname === "/unauthorized") {
    return NextResponse.next();
  }

  // If accessing a public route while authenticated, redirect to dashboard
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/jw/home", request.url));
  }

  // If accessing a protected route without authentication, redirect to login
  if (!token && (!publicRoutes.includes(pathname) || pathname === "/")) {
    return NextResponse.redirect(new URL("/jw/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
