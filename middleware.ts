import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { globalRateLimit } from "@/lib/rate-limit";

/**
 * Middleware for route protection and rate limiting
 * 
 * Runs on every request to protected routes
 * Enforces authentication at the edge (before reaching the application)
 * 
 * Protected routes: /dashboard, /appointments, /patients, /providers
 * Public routes: /, /login, /api/auth/*
 */

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // ✅ ADDED: Rate limiting
  const identifier = req.ip || req.auth?.user?.id || "anonymous";
  const { success, limit, remaining, reset } = globalRateLimit(identifier);

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(reset).toISOString(),
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  // Define route types
  const isPublicRoute =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/api/auth");

  const isProtectedRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/appointments") ||
    nextUrl.pathname.startsWith("/patients") ||
    nextUrl.pathname.startsWith("/providers") ||
    nextUrl.pathname.startsWith("/settings");

  // Redirect to login if accessing protected route while not authenticated
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing login while authenticated
  if (nextUrl.pathname.startsWith("/login") && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // ✅ ADDED: Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(reset).toISOString());

  return response;
});

/**
 * Matcher configuration
 * 
 * Runs middleware only on specified routes
 * Excludes static files and API routes (except auth)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/(?!auth)).*)",
  ],
};
