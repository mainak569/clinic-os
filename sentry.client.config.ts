/**
 * Sentry Client Configuration
 * 
 * Captures client-side errors and sends to Sentry
 * 
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Get DSN from Sentry dashboard
 * 3. Set NEXT_PUBLIC_SENTRY_DSN in environment variables
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

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
      // Browser extensions
      "top.GLOBALS",
      // Random network errors
      "NetworkError",
      "Non-Error promise rejection",
    ],
    
    // Before send hook - sanitize sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter((breadcrumb) => {
          // Filter out potentially sensitive URLs
          if (breadcrumb.data?.url) {
            const url = breadcrumb.data.url;
            if (url.includes("password") || url.includes("token")) {
              return false;
            }
          }
          return true;
        });
      }
      
      // Remove cookies and auth headers
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.cookie;
          delete event.request.headers.authorization;
        }
      }
      
      return event;
    },
  });
} else {
  console.warn("[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured. Error tracking disabled.");
}
