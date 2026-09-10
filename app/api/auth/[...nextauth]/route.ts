import { handlers } from "@/auth";

/**
 * Auth.js API Route Handlers
 * 
 * Handles all authentication routes:
 * - POST /api/auth/signin
 * - POST /api/auth/signout
 * - GET /api/auth/session
 * - GET /api/auth/csrf
 * - etc.
 */

export const { GET, POST } = handlers;
