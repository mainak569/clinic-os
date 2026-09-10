import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

/**
 * Extended NextAuth types
 * Adds custom user properties to session and JWT
 */

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: Role;
    providerId: string | null;
    providerName: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      providerId: string | null;
      providerName: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    providerId: string | null;
    providerName: string | null;
  }
}
