import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";

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

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            provider: true,
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("Account is inactive. Please contact support.");
        }

        // Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

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
