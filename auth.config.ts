import type { NextAuthConfig } from "next-auth";

/**
 * Auth.js Configuration
 * 
 * This is the edge-compatible configuration that doesn't use Prisma.
 * Database operations are moved to the authorize callback which runs in Node.js runtime.
 * 
 * Security Features:
 * - Credentials provider with bcrypt password hashing
 * - JWT sessions for stateless authentication
 * - Role-based access control (PROVIDER, FRONT_DESK)
 * - HTTP-only cookies to prevent XSS
 * - CSRF protection built-in
 */

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [], // Providers will be added in auth.ts (Node.js runtime)
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add custom claims to JWT
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.providerId = user.providerId;
        token.providerName = user.providerName;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom claims to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.providerId = token.providerId as string | null;
        session.user.providerName = token.providerName as string | null;
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isOnPublicPage = nextUrl.pathname === "/";

      // Allow access to public pages
      if (isOnPublicPage) {
        return true;
      }

      // Redirect to login if not authenticated
      if (!isLoggedIn && !isOnLoginPage) {
        return false;
      }

      // Redirect to dashboard if already logged in and trying to access login
      if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;
