/**
 * Memory-based rate limiting
 *
 * State lives in this server instance's memory: it resets on restart and isn't
 * shared between instances. A deployment with several instances would need a
 * shared store such as Redis.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const globalRequests = new Map<string, RateLimitRecord>();
const failedLogins = new Map<string, RateLimitRecord>();

// Drop expired entries every 5 minutes
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const store of [globalRequests, failedLogins]) {
    for (const [key, value] of store.entries()) {
      if (now > value.resetAt) {
        store.delete(key);
      }
    }
  }
}, 5 * 60 * 1000);
// Don't keep a Node process (such as a test run) alive just for cleanup.
(cleanup as { unref?: () => void }).unref?.();

function checkRateLimit(
  store: Map<string, RateLimitRecord>,
  identifier: string,
  limit: number,
  windowMs: number
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt };
  }

  record.count++;
  return { success: true, limit, remaining: limit - record.count, reset: record.resetAt };
}

/**
 * Global rate limit: 100 requests per minute per client IP.
 * Applied by middleware to pages and the sign-in endpoint. Other API routes
 * aren't matched by the middleware, so they aren't rate limited.
 */
export function globalRateLimit(identifier: string) {
  return checkRateLimit(globalRequests, identifier, 100, 60 * 1000);
}

/** Failed sign-ins allowed per email before it is locked for the window. */
const MAX_FAILED_LOGINS = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Whether sign-in for this email is locked after too many failed attempts.
 * Only failures count, so successful sign-ins (for example several reviewers
 * sharing a demo account) never lock an account.
 */
export function isLoginBlocked(identifier: string): boolean {
  const record = failedLogins.get(identifier);
  return !!record && Date.now() <= record.resetAt && record.count >= MAX_FAILED_LOGINS;
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const record = failedLogins.get(identifier);
  if (!record || now > record.resetAt) {
    failedLogins.set(identifier, { count: 1, resetAt: now + FAILED_LOGIN_WINDOW_MS });
  } else {
    record.count++;
  }
}

export function clearFailedLogins(identifier: string): void {
  failedLogins.delete(identifier);
}
