import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import { clearFailedLogins, isLoginBlocked, recordFailedLogin } from "@/lib/rate-limit";

/**
 * NextAuth.js v5 Configuration
 *
 * The Credentials provider is added here (Node.js runtime) to use Prisma.
 * Edge-compatible config is in auth.config.ts
 *
 * Exports:
 * - auth: Middleware and route handler
 * - signIn: Sign in function
 * - signOut: Sign out function
 * - handlers: API route handlers
 */

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        // Emails are stored lower-case, so match that regardless of how they're typed.
        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);

        // 5 failed attempts lock this email for 15 minutes (lib/rate-limit.ts).
        if (isLoginBlocked(email)) {
          throw new Error("Too many failed sign-in attempts. Try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            provider: true,
          },
        });

        // Check the password before the account status, and give every failure
        // the same answer, so a response never reveals which emails exist or
        // belong to a deactivated account.
        const isPasswordValid = user
          ? await bcrypt.compare(password, user.passwordHash)
          : false;

        if (!user || !isPasswordValid || !user.isActive) {
          recordFailedLogin(email);
          throw new Error("Invalid email or password");
        }

        clearFailedLogins(email);

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          providerId: user.provider?.id || null,
          providerName: user.provider
            ? `${user.provider.firstName} ${user.provider.lastName}`
            : null,
        };
      },
    }),
  ],
});
