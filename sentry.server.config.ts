/**
 * Sentry Server Configuration
 * 
 * Captures server-side errors and sends to Sentry
 * 
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Get DSN from Sentry dashboard
 * 3. Set SENTRY_DSN in environment variables
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Environment
    environment: process.env.NODE_ENV,
    
    // Sample rate for performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Debug mode (only in development)
    debug: process.env.NODE_ENV === "development",
    
    // Ignore certain errors
    ignoreErrors: [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
    ],
    
    // Before send hook - sanitize sensitive data
    beforeSend(event) {
      // Remove sensitive data from extra context
      if (event.extra) {
        // Remove potential PHI
        delete event.extra.patientData;
        delete event.extra.visitNote;
        delete event.extra.password;
        delete event.extra.passwordHash;
        delete event.extra.token;
      }
      
      // Remove sensitive request data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.cookie;
          delete event.request.headers.authorization;
        }
        
        // Sanitize query string
        if (event.request.query_string) {
          const params = new URLSearchParams(event.request.query_string);
          params.delete("password");
          params.delete("token");
          event.request.query_string = params.toString();
        }
      }
      
      return event;
    },
  });
} else {
  console.warn("[Sentry] SENTRY_DSN not configured. Error tracking disabled.");
}
