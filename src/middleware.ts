import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Matches /{prefix}, /{prefix}/login, /{prefix}/register, /{prefix}/forgot_password, /{prefix}/verify-email, /{prefix}/verify
const PUBLIC_ROUTE_RE = /^\/[^/]+(\/login|\/register|\/forgot_password|\/verify-email|\/verify)?$/;

function isPublicRoute(pathname: string): boolean {
  return pathname === "/" || PUBLIC_ROUTE_RE.test(pathname);
}

function getPrefix(pathname: string): string {
  const seg = pathname.split("/")[1];
  return seg || "jw";
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|map|json)$/.test(pathname) ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  // /unauthorized must always be reachable regardless of auth state
  if (pathname === "/unauthorized") {
    return NextResponse.next();
  }

  const prefix = getPrefix(pathname);

  // Authenticated user on a public route → redirect to home
  if (token && isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL(`/${prefix}/home`, request.url));
  }

  // Unauthenticated user on a protected route.
  // If the refresh token is still present, the access token just expired — let the
  // request through. Apollo's error link will silently refresh on the first GraphQL
  // call and retry, so the user never sees the login page mid-session.
  // Only hard-redirect to login when BOTH tokens are absent (true session end).
  if (!token && !isPublicRoute(pathname)) {
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (refreshToken) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(`/${prefix}/login`, request.url));
  }

  // Unauthenticated user at root → redirect to default store login
  if (!token && pathname === "/") {
    return NextResponse.redirect(new URL("/jw/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
